// ==UserScript==
// @name          Starblast Gamepad Script
// @namespace     http://tampermonkey.net/
// @version       3.8
// @description   Gamepad script for starblast.io itself. is able to run with SUBSPACE
// @author        plxyer-x
// @match         https://starblast.io/*
// @grant         none
// @run-at        document-idle
// ==/UserScript==

(() => {
    const DEADZONE = 0.15;
    const TURN_RADIUS = 200;

    // --- Current State Variables for Selectors ---
    let currentShipIndex = 0;
    const MAX_SHIP_INDEX = 1;

    let currentUpgradeIndex = 1;
    const MAX_UPGRADE_INDEX = 8;

    // Store the last active selector type to manage visibility
    let activeSelectorType = null; // 'upgrade' or 'ship'

    const BUTTON_ACTIONS = {
        0:  { type: 'key', key: 'alt' },      // X: Launch Secondary (Alt)
        1:  { type: 'mouse', button: 0 },     // O: Fire (Left Click)
        3:  { type: 'key', key: 'shift' },    // Triangle: Toggle Weapons (Shift)
        4:  { type: 'key', key: 'v' },        // L1: Throw Gems (v)
        5:  { type: 'key', key: 'tab' },      // R1: Toggle between teams (Tab)
        6:  { type: 'key', key: 'control' },  // L2: RCS Toggle (Control)
        7:  { type: 'mouse', button: 2 },     // R2: Accelerate (Right Click)
        11: { type: 'key', key: 'c' },        // Right Stick Click: Chat (c)
    };

    const lastButtonState = {};
    const getCanvas = () => document.querySelector('canvas');

    // --- UI Management Functions (placeholders as arrow is removed) ---
    const createSelectorArrow = () => {};
    const updateSelectorArrowPosition = (type, index) => {};
    const hideSelectorArrow = () => {
        if (activeSelectorType !== null) {
            console.log(`Exited ${activeSelectorType} selection mode.`);
        }
        activeSelectorType = null;
    };

    const dispatchMouseEvent = (type, button) => {
        const canvas = getCanvas();
        if (!canvas) return;
        canvas.dispatchEvent(new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            button,
            buttons: 1 << button,
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2
        }));
    };

    const dispatchKeyboardEvent = (type, key) => {
        const canvas = getCanvas();
        let eventOptions = {
            key: key,
            bubbles: true,
            cancelable: true
        };

        switch (key.toLowerCase()) {
            case 'alt':
                eventOptions.keyCode = 18; eventOptions.which = 18; eventOptions.code = 'AltLeft'; eventOptions.altKey = true;
                break;
            case 'shift':
                eventOptions.keyCode = 16; eventOptions.which = 16; eventOptions.code = 'ShiftLeft'; eventOptions.shiftKey = true;
                break;
            case 'control':
                eventOptions.keyCode = 17; eventOptions.which = 17; eventOptions.code = 'ControlLeft'; eventOptions.ctrlKey = true;
                break;
            case 'tab':
                eventOptions.keyCode = 9; eventOptions.which = 9; eventOptions.code = 'Tab';
                break;
            case 'c':
                eventOptions.keyCode = 67; eventOptions.which = 67; eventOptions.code = 'KeyC';
                break;
            case 'v':
                eventOptions.keyCode = 86; eventOptions.which = 86; eventOptions.code = 'KeyV';
                break;
            case '0': case '1': case '2': case '3': case '4':
            case '5': case '6': case '7': case '8': case '9':
                eventOptions.keyCode = key.charCodeAt(0);
                eventOptions.which = eventOptions.keyCode;
                eventOptions.code = `Digit${key}`;
                break;
            default:
                if (key.length === 1) {
                    eventOptions.keyCode = key.toUpperCase().charCodeAt(0);
                    eventOptions.which = eventOptions.keyCode;
                    eventOptions.code = `Key${key.toUpperCase()}`;
                } else {
                    eventOptions.code = key;
                }
                break;
        }
        const event = new KeyboardEvent(type, eventOptions);
        window.dispatchEvent(event);
        document.dispatchEvent(event);
        if (canvas) canvas.dispatchEvent(event);
    };


    const handleButton = (index, pressed) => {
        const action = BUTTON_ACTIONS[index];
        if (!action) return;

        if (action.type === 'mouse') {
            pressed
                ? dispatchMouseEvent("mousedown", action.button)
                : dispatchMouseEvent("mouseup", action.button);
        } else if (action.type === 'key') {
            pressed
                ? dispatchKeyboardEvent("keydown", action.key)
                : dispatchKeyboardEvent("keyup", action.key);
        }
    };

    const simulateMouseMove = (deltaX, deltaY) => {
        const canvas = getCanvas();
        if (!canvas) return;
        canvas.dispatchEvent(new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            clientX: window.innerWidth / 2 + deltaX,
            clientY: window.innerHeight / 2 + deltaY,
            movementX: deltaX,
            movementY: deltaY
        }));
    };

    const handleTurn = (xAxis, yAxis) => {
        const magnitude = Math.sqrt(xAxis ** 2 + yAxis ** 2);
        if (magnitude < DEADZONE) return;

        const adjusted = (magnitude - DEADZONE) / (1 - DEADZONE);
        const normX = xAxis / magnitude;
        const normY = yAxis / magnitude;

        simulateMouseMove(normX * adjusted * TURN_RADIUS, normY * adjusted * TURN_RADIUS);
    };

    const pollGamepad = () => {
        const gp = navigator.getGamepads?.()[0];
        if (!gp) {
            hideSelectorArrow();
            return;
        }

        // --- Handle D-Pad Logic ---
        const dPadUpPressed = gp.buttons[12] && gp.buttons[12].pressed;
        const dPadDownPressed = gp.buttons[13] && gp.buttons[13].pressed;
        const dPadLeftPressed = gp.buttons[14] && gp.buttons[14].pressed;
        const dPadRightPressed = gp.buttons[15] && gp.buttons[15].pressed;

        // --- D-pad Up (Ship Selector Toggle/Confirm) ---
        if (dPadUpPressed && !lastButtonState[12]) {
            if (activeSelectorType === 'ship') {
                dispatchKeyboardEvent("keydown", currentShipIndex.toString());
                setTimeout(() => dispatchKeyboardEvent("keyup", currentShipIndex.toString()), 50);
                console.log(`Confirmed Ship: ${currentShipIndex}`);
                activeSelectorType = null;
            } else {
                if (activeSelectorType === 'upgrade') {
                    activeSelectorType = null;
                }
                activeSelectorType = 'ship';
                updateSelectorArrowPosition('ship', currentShipIndex);
                console.log(`Entered Ship Selection. Current: ${currentShipIndex}`);
            }
        }

        // --- D-pad Down (Upgrade Selector Toggle/Confirm) ---
        if (dPadDownPressed && !lastButtonState[13]) {
            if (activeSelectorType === 'upgrade') {
                console.log(`Confirming upgrade: ${currentUpgradeIndex}`);
                dispatchKeyboardEvent("keydown", currentUpgradeIndex.toString());
                setTimeout(() => dispatchKeyboardEvent("keyup", currentUpgradeIndex.toString()), 50);
                activeSelectorType = null;
            } else {
                if (activeSelectorType === 'ship') {
                    activeSelectorType = null;
                }
                activeSelectorType = 'upgrade';
                updateSelectorArrowPosition('upgrade', currentUpgradeIndex);
                console.log(`Entered Upgrade Selection. Current: ${currentUpgradeIndex}`);
            }
        }

        // --- D-pad Left/Right (Cycle Selector ONLY if a mode is active) ---
        if (dPadLeftPressed && !lastButtonState[14]) {
            if (activeSelectorType === 'upgrade') {
                currentUpgradeIndex = Math.max(1, currentUpgradeIndex - 1);
                updateSelectorArrowPosition('upgrade', currentUpgradeIndex);
                console.log(`Cycled Left to Upgrade: ${currentUpgradeIndex}`);
            } else if (activeSelectorType === 'ship') {
                currentShipIndex = Math.max(0, currentShipIndex - 1);
                updateSelectorArrowPosition('ship', currentShipIndex);
                console.log(`Cycled Left to Ship: ${currentShipIndex}`);
            }
        }

        if (dPadRightPressed && !lastButtonState[15]) {
            if (activeSelectorType === 'upgrade') {
                currentUpgradeIndex = Math.min(MAX_UPGRADE_INDEX, currentUpgradeIndex + 1);
                updateSelectorArrowPosition('upgrade', currentUpgradeIndex);
                console.log(`Cycled Right to Upgrade: ${currentUpgradeIndex}`);
            } else if (activeSelectorType === 'ship') {
                currentShipIndex = Math.min(MAX_SHIP_INDEX, currentShipIndex + 1);
                updateSelectorArrowPosition('ship', currentShipIndex);
                console.log(`Cycled Right to Ship: ${currentShipIndex}`);
            }
        }

        // --- Update lastButtonState for D-pad ---
        lastButtonState[12] = dPadUpPressed;
        lastButtonState[13] = dPadDownPressed;
        lastButtonState[14] = dPadLeftPressed;
        lastButtonState[15] = dPadRightPressed;


        // --- Process other buttons (from BUTTON_ACTIONS) ---
        gp.buttons.forEach((btn, i) => {
            // Skip D-pad buttons as they are handled above
            if (i >= 12 && i <= 15) return;

            const pressed = btn.pressed;
            if (pressed !== lastButtonState[i]) {
                handleButton(i, pressed);
                lastButtonState[i] = pressed;
            }
        });

        // Left stick for movement (assuming axes 0, 1 for PS5 left stick)
        handleTurn(gp.axes[0], gp.axes[1]);
    };

    const startLoop = () => {
        const loop = () => {
            pollGamepad();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    };

    // Extreme delay (15 seconds) to give Subspace ample time to load its client
    window.addEventListener('load', () => setTimeout(startLoop, 15000));
})();
