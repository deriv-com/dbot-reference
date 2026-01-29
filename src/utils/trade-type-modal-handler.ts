import { getCurrentTradeTypeFromWorkspace } from './blockly-url-param-handler';
import { getTradeTypeFromCurrentUrl } from './url-trade-type-handler';

// Import types from blockly-url-param-handler to avoid conflicts
type BlocklyBlock = {
    type: string;
    getFieldValue: (fieldName: string) => string;
    setFieldValue: (value: string, fieldName: string) => void;
    getChildByType: (type: string) => BlocklyBlock | null;
};

// Modal state management
interface TradeTypeData {
    displayName: string;
    tradeTypeCategory: string;
    tradeType: string;
    isValid: boolean;
    urlParam?: string;
    currentTradeType?: { tradeTypeCategory: string; tradeType: string } | null;
    currentTradeTypeDisplayName?: string;
}

interface TradeTypeModalState {
    isVisible: boolean;
    tradeTypeData: TradeTypeData | null;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
}

// State Management Note:
// This module uses module-level state for simplicity in the current single-modal use case.
// For applications requiring multiple modal instances, server-side rendering, or enhanced
// testing isolation, consider migrating to React Context or a state management library.
let modalState: TradeTypeModalState = {
    isVisible: false,
    tradeTypeData: null,
    onConfirm: null,
    onCancel: null,
};

// Callback to notify when modal state changes
let modalStateChangeCallback: ((state: TradeTypeModalState) => void) | null = null;

// Store active polling timeout to prevent memory leaks and multiple polling instances
let activePollingTimeoutId: ReturnType<typeof setTimeout> | null = null;

// AbortController for robust polling management
let pollingAbortController: AbortController | null = null;

// State update lock to prevent race conditions
let isUpdatingModalState = false;

// Debouncing mechanism to prevent multiple rapid polling calls
let isPollingActive = false;

/**
 * Sets the callback function to be called when modal state changes
 */
export const setModalStateChangeCallback = (callback: (state: TradeTypeModalState) => void) => {
    modalStateChangeCallback = callback;
};

/**
 * Gets the current modal state
 */
export const getModalState = (): TradeTypeModalState => {
    return { ...modalState };
};

/**
 * Updates the modal state and notifies listeners
 * Protected against race conditions with state locking
 */
const updateModalState = (newState: Partial<TradeTypeModalState>) => {
    // Prevent race conditions by checking if another update is in progress
    if (isUpdatingModalState) {
        console.warn('Modal state update skipped due to concurrent update in progress');
        return;
    }

    isUpdatingModalState = true;
    try {
        modalState = { ...modalState, ...newState };
        if (modalStateChangeCallback) {
            modalStateChangeCallback(modalState);
        }
    } finally {
        isUpdatingModalState = false;
    }
};

/**
 * Updates the current trade type data in the modal if it's currently visible
 * Protected against race conditions
 */
export const updateModalTradeTypeData = () => {
    // Prevent race conditions by checking state update lock
    if (isUpdatingModalState || !modalState.isVisible || !modalState.tradeTypeData) {
        return;
    }

    // Get fresh current trade type from workspace
    const currentTradeType = getCurrentTradeTypeFromWorkspace();

    if (currentTradeType) {
        const currentTradeTypeDisplayName = getInternalTradeTypeDisplayName(
            currentTradeType.tradeTypeCategory,
            currentTradeType.tradeType
        );

        // Update the modal data with the fresh current trade type
        const updatedTradeTypeData = {
            ...modalState.tradeTypeData,
            currentTradeType: currentTradeType,
            currentTradeTypeDisplayName: currentTradeTypeDisplayName,
        };

        updateModalState({
            tradeTypeData: updatedTradeTypeData,
        });
    }
};

/**
 * Shows the trade type confirmation modal with enhanced error handling and robust polling management
 */
export const showTradeTypeConfirmationModal = (
    tradeTypeData: TradeTypeData,
    onConfirm: () => void,
    onCancel: () => void
) => {
    try {
        // Prevent multiple concurrent polling instances
        if (isPollingActive) {
            console.warn('Modal polling already active, skipping duplicate request');
            return;
        }

        // Function to show modal with current workspace data
        const showModalWithCurrentData = () => {
            try {
                const currentTradeType = getCurrentTradeTypeFromWorkspace();

                const finalTradeTypeData = currentTradeType
                    ? {
                          ...tradeTypeData,
                          currentTradeType: currentTradeType,
                          currentTradeTypeDisplayName: getInternalTradeTypeDisplayName(
                              currentTradeType.tradeTypeCategory,
                              currentTradeType.tradeType
                          ),
                      }
                    : tradeTypeData;

                updateModalState({
                    isVisible: true,
                    tradeTypeData: finalTradeTypeData,
                    onConfirm,
                    onCancel,
                });
            } catch (error) {
                console.warn('Failed to show modal with current data:', error);
                // Fallback: show modal with original data
                updateModalState({
                    isVisible: true,
                    tradeTypeData,
                    onConfirm,
                    onCancel,
                });
            } finally {
                // Clean up polling state
                isPollingActive = false;
                if (pollingAbortController) {
                    pollingAbortController.abort();
                    pollingAbortController = null;
                }
            }
        };

        // Clear any existing polling resources to prevent memory leaks
        if (activePollingTimeoutId) {
            clearTimeout(activePollingTimeoutId);
            activePollingTimeoutId = null;
        }
        if (pollingAbortController) {
            pollingAbortController.abort();
            pollingAbortController = null;
        }

        // Try to get current trade type immediately
        const currentTradeType = getCurrentTradeTypeFromWorkspace();

        if (currentTradeType) {
            // If we have the data immediately, show modal
            showModalWithCurrentData();
        } else {
            // Set polling active flag and create AbortController for robust management
            isPollingActive = true;
            pollingAbortController = new AbortController();

            // If we don't have the data yet, poll until we do or timeout
            let attempts = 0;
            const maxAttempts = 6; // 3 seconds max wait with 500ms intervals

            const pollForData = () => {
                try {
                    // Check if polling was aborted
                    if (pollingAbortController?.signal.aborted) {
                        return;
                    }

                    const currentTradeType = getCurrentTradeTypeFromWorkspace();

                    if (currentTradeType || attempts >= maxAttempts) {
                        showModalWithCurrentData();
                        // Proper cleanup: clear timeout before setting to null
                        if (activePollingTimeoutId) {
                            clearTimeout(activePollingTimeoutId);
                        }
                        activePollingTimeoutId = null;
                    } else {
                        attempts++;
                        // Use 500ms intervals for better performance
                        activePollingTimeoutId = setTimeout(pollForData, 500);
                    }
                } catch (error) {
                    console.warn('Error during polling for trade type data:', error);
                    // Stop polling on error and show modal with available data
                    showModalWithCurrentData();
                    if (activePollingTimeoutId) {
                        clearTimeout(activePollingTimeoutId);
                    }
                    activePollingTimeoutId = null;
                }
            };

            // Start polling with initial call
            pollForData();
        }
    } catch (error) {
        console.warn('Failed to show trade type confirmation modal:', error);
        isPollingActive = false;
        // Clean up resources on error
        if (activePollingTimeoutId) {
            clearTimeout(activePollingTimeoutId);
            activePollingTimeoutId = null;
        }
        if (pollingAbortController) {
            pollingAbortController.abort();
            pollingAbortController = null;
        }
        // Fallback: try to show modal with minimal data
        try {
            updateModalState({
                isVisible: true,
                tradeTypeData,
                onConfirm,
                onCancel,
            });
        } catch (fallbackError) {
            console.error('Critical error: Failed to show modal even with fallback:', fallbackError);
        }
    }
};

/**
 * Hides the trade type confirmation modal with comprehensive cleanup
 */
export const hideTradeTypeConfirmationModal = () => {
    try {
        // Clear any active polling timeout when hiding modal
        if (activePollingTimeoutId) {
            clearTimeout(activePollingTimeoutId);
            activePollingTimeoutId = null;
        }

        // Abort any active polling operations
        if (pollingAbortController) {
            pollingAbortController.abort();
            pollingAbortController = null;
        }

        // Reset polling active flag
        isPollingActive = false;

        updateModalState({
            isVisible: false,
            tradeTypeData: null,
            onConfirm: null,
            onCancel: null,
        });
    } catch (error) {
        console.warn('Error while hiding trade type confirmation modal:', error);
        // Force reset state even on error
        isPollingActive = false;
        if (activePollingTimeoutId) {
            clearTimeout(activePollingTimeoutId);
            activePollingTimeoutId = null;
        }
        if (pollingAbortController) {
            pollingAbortController.abort();
            pollingAbortController = null;
        }
    }
};

/**
 * Handles the user confirming the trade type change with comprehensive error handling
 */
export const handleTradeTypeConfirm = () => {
    try {
        // Apply the trade type changes directly to the Blockly workspace
        if (modalState.tradeTypeData) {
            const { tradeTypeCategory, tradeType } = modalState.tradeTypeData;

            try {
                // Apply the changes to the workspace
                const success = applyTradeTypeDropdownChanges(tradeTypeCategory, tradeType);

                if (success) {
                    console.warn(`Successfully applied trade type: ${tradeTypeCategory}/${tradeType}`);
                } else {
                    console.warn(`Failed to apply trade type: ${tradeTypeCategory}/${tradeType}`);
                }
            } catch (applyError) {
                console.warn('Error applying trade type changes to workspace:', applyError);
            }
        }

        // Remove the URL parameter after applying changes
        try {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('trade_type')) {
                const url = new URL(window.location.href);
                url.searchParams.delete('trade_type');
                window.history.replaceState({}, '', url.toString());
            }
        } catch (urlError) {
            console.warn('Error removing URL parameter:', urlError);
        }

        // Call the original onConfirm callback if it exists
        try {
            if (modalState.onConfirm) {
                modalState.onConfirm();
            }
        } catch (callbackError) {
            console.warn('Error executing onConfirm callback:', callbackError);
        }

        hideTradeTypeConfirmationModal();
    } catch (error) {
        console.warn('Critical error in handleTradeTypeConfirm:', error);
        // Ensure modal is hidden even on error
        try {
            hideTradeTypeConfirmationModal();
        } catch (hideError) {
            console.error('Failed to hide modal after error:', hideError);
        }
    }
};

/**
 * Handles the user canceling the trade type change with comprehensive error handling
 */
export const handleTradeTypeCancel = () => {
    try {
        // Remove the URL parameter when user cancels
        try {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('trade_type')) {
                const url = new URL(window.location.href);
                url.searchParams.delete('trade_type');
                window.history.replaceState({}, '', url.toString());
            }
        } catch (urlError) {
            console.warn('Error removing URL parameter on cancel:', urlError);
        }

        // Call the original onCancel callback if it exists
        try {
            if (modalState.onCancel) {
                modalState.onCancel();
            }
        } catch (callbackError) {
            console.warn('Error executing onCancel callback:', callbackError);
        }

        hideTradeTypeConfirmationModal();
    } catch (error) {
        console.warn('Critical error in handleTradeTypeCancel:', error);
        // Ensure modal is hidden even on error
        try {
            hideTradeTypeConfirmationModal();
        } catch (hideError) {
            console.error('Failed to hide modal after cancel error:', hideError);
        }
    }
};

/**
 * Gets display name for trade type from URL parameter
 */
export const getTradeTypeDisplayName = (urlParam: string): string => {
    const displayNames: Record<string, string> = {
        // Original mappings
        rise_equals_fall_equals: 'Rise Equals/Fall Equals',
        higher_lower: 'Higher/Lower',
        touch_no_touch: 'Touch/No Touch',
        in_out: 'In/Out',
        digits: 'Digits',
        multiplier: 'Multiplier',
        accumulator: 'Accumulator',
        asian: 'Asian',
        reset: 'Reset',
        high_low_ticks: 'High/Low Ticks',
        only_ups_downs: 'Only Ups/Downs',

        // New mappings from external application identifiers matching your specifications
        match_diff: 'Matches/Differs',
        even_odd: 'Even/Odd',
        over_under: 'Over/Under',
        rise_fall: 'Rise/Fall',
        high_low: 'Higher/Lower', // This is for Higher/Lower (updown category)
        high_tick: 'High Tick/Low Tick', // This is for High Tick/Low Tick (separate from high_low)
        accumulators: 'Accumulators',
        only_up_only_down: 'Only Ups/Only Downs',
        touch: 'Touch/No Touch',
        multipliers: 'Multipliers',

        // Additional new trade types
        ends_between_ends_outside: 'Ends Between/Ends Outside',
        stays_between_goes_outside: 'Stays Between/Goes Outside',
        asians: 'Asians',
        reset_call_reset_put: 'Reset Call/Reset Put',
    };

    return displayNames[urlParam] || urlParam;
};

/**
 * Gets display name for internal trade type values
 */
export const getInternalTradeTypeDisplayName = (tradeTypeCategory: string, tradeType: string): string => {
    // Map internal trade type combinations to user-friendly names
    const tradeTypeDisplayNames: Record<string, Record<string, string>> = {
        callput: {
            callput: 'Rise/Fall',
            callputequal: 'Rise Equals/Fall Equals',
            higherlower: 'Higher/Lower',
        },
        touchnotouch: {
            touchnotouch: 'Touch/No Touch',
        },
        inout: {
            endsinout: 'Ends In/Out',
            staysinout: 'Stays In/Out',
        },
        digits: {
            matchesdiffers: 'Matches/Differs',
            evenodd: 'Even/Odd',
            overunder: 'Over/Under',
        },
        multiplier: {
            multiplier: 'Multiplier',
        },
        accumulator: {
            accumulator: 'Accumulator',
        },
        asian: {
            asians: 'Asian Up/Down',
        },
        reset: {
            reset: 'Reset Call/Put',
        },
        highlowticks: {
            highlowticks: 'High/Low Ticks',
        },
        runs: {
            runs: 'Only Ups/Downs',
        },
    };

    return tradeTypeDisplayNames[tradeTypeCategory]?.[tradeType] || `${tradeTypeCategory}/${tradeType}`;
};
/**
 * Gets the dropdown mapping for a URL trade type parameter
 * @returns Object with trade type category and type, or null if invalid
 * @example
 * const mapping = getDropdownMappingForUrlTradeType();
 * // Returns: { tradeTypeCategory: 'multiplier', tradeType: 'multiplier' }
 */
export const getDropdownMappingForUrlTradeType = (): { tradeTypeCategory: string; tradeType: string } | null => {
    const tradeTypeFromUrl = getTradeTypeFromCurrentUrl();

    if (!tradeTypeFromUrl || !tradeTypeFromUrl.isValid) {
        return null;
    }

    return {
        tradeTypeCategory: tradeTypeFromUrl.tradeTypeCategory,
        tradeType: tradeTypeFromUrl.tradeType,
    };
};

/**
 * Applies trade type dropdown changes to the Blockly workspace
 * @param tradeTypeCategory - The trade type category (e.g., 'multiplier', 'digits')
 * @param tradeType - The specific trade type (e.g., 'multiplier', 'matchesdiffers')
 * @returns boolean indicating success or failure
 * @example
 * const success = applyTradeTypeDropdownChanges('multiplier', 'multiplier');
 * // Updates Blockly workspace to show "Multipliers" in dropdown
 */
export const applyTradeTypeDropdownChanges = (tradeTypeCategory: string, tradeType: string): boolean => {
    let originalGroup: string | null = null;

    try {
        const workspace = window.Blockly?.derivWorkspace;
        if (!workspace) {
            console.warn('Blockly workspace not available for trade type changes');
            return false;
        }

        // Find the trade definition block
        const tradeDefinitionBlocks = workspace
            .getAllBlocks()
            .filter((block: BlocklyBlock) => block.type === 'trade_definition');

        if (tradeDefinitionBlocks.length === 0) {
            console.warn('No trade definition blocks found in workspace');
            return false;
        }

        // Get the first trade definition block
        const tradeDefinitionBlock = tradeDefinitionBlocks[0];

        // Find the trade type block within the trade definition
        const tradeTypeBlock = tradeDefinitionBlock.getChildByType('trade_definition_tradetype');

        if (!tradeTypeBlock) {
            console.warn('No trade type block found within trade definition');
            return false;
        }

        // Disable events temporarily to prevent interference
        originalGroup = window.Blockly.Events.getGroup();
        window.Blockly.Events.setGroup('TRADE_TYPE_MODAL_UPDATE');

        try {
            // Get current values
            const currentCategory = tradeTypeBlock.getFieldValue('TRADETYPECAT_LIST');

            // Set the category if it's different
            if (currentCategory !== tradeTypeCategory) {
                tradeTypeBlock.setFieldValue(tradeTypeCategory, 'TRADETYPECAT_LIST');

                // Fire change event for category to trigger trade type options update
                const categoryChangeEvent = new window.Blockly.Events.BlockChange(
                    tradeTypeBlock,
                    'field',
                    'TRADETYPECAT_LIST',
                    currentCategory,
                    tradeTypeCategory
                );
                window.Blockly.Events.fire(categoryChangeEvent);
            }

            // Get current trade type value (might have changed after category update)
            const updatedCurrentTradeType = tradeTypeBlock.getFieldValue('TRADETYPE_LIST');

            // Set the trade type if it's different
            if (updatedCurrentTradeType !== tradeType) {
                tradeTypeBlock.setFieldValue(tradeType, 'TRADETYPE_LIST');

                // Fire change event for trade type
                const tradeTypeChangeEvent = new window.Blockly.Events.BlockChange(
                    tradeTypeBlock,
                    'field',
                    'TRADETYPE_LIST',
                    updatedCurrentTradeType,
                    tradeType
                );
                window.Blockly.Events.fire(tradeTypeChangeEvent);

                // Force workspace to re-render
                if (workspace) {
                    workspace.render();
                }
            }

            // Restore original event group on success
            window.Blockly.Events.setGroup(originalGroup);
            return true;
        } catch (innerError) {
            console.warn('Failed to apply trade type changes to Blockly workspace:', innerError);
            // Restore original event group on inner error
            window.Blockly.Events.setGroup(originalGroup);
            return false;
        }
    } catch (outerError) {
        console.warn('Failed to apply trade type dropdown changes:', outerError);
        // Restore original event group on outer error (if it was set)
        if (originalGroup !== null) {
            try {
                window.Blockly.Events.setGroup(originalGroup);
            } catch (restoreError) {
                console.warn('Failed to restore original event group:', restoreError);
            }
        }
        return false;
    }
};
// Track if we've already processed a URL parameter in this session
// Enhanced to tie to specific URL patterns for better session management
const processedUrlParams = new Set<string>();

/**
 * Resets the URL parameter processing flag (useful for testing or when URL changes)
 * Can optionally reset for a specific URL parameter
 */
export const resetUrlParamProcessing = (specificParam?: string) => {
    if (specificParam) {
        processedUrlParams.delete(specificParam);
    } else {
        processedUrlParams.clear();
    }
};

/**
 * Gets the current URL parameter processing state (for testing)
 */
export const getUrlParamProcessingState = (param?: string) => {
    if (param) {
        return processedUrlParams.has(param);
    }
    return Array.from(processedUrlParams);
};

/**
 * Checks if a specific URL parameter has been processed
 */
const hasProcessedUrlParam = (param: string) => {
    return processedUrlParams.has(param);
};

/**
 * Marks a URL parameter as processed
 */
const markUrlParamAsProcessed = (param: string) => {
    processedUrlParams.add(param);
};

/**
 * Checks if there's a valid URL trade type parameter and shows modal if needed
 * Enhanced logic with comprehensive error handling and workspace timing
 */
export const checkAndShowTradeTypeModal = (onConfirm: () => void, onCancel: () => void) => {
    try {
        // 1. Check if there's a valid URL trade type parameter
        const tradeTypeFromUrl = getTradeTypeFromCurrentUrl();

        if (!tradeTypeFromUrl || !tradeTypeFromUrl.isValid) {
            return false;
        }

        // 2. Get the URL parameter to show user-friendly name
        const urlParams = new URLSearchParams(window.location.search);
        const tradeTypeParam = urlParams.get('trade_type');

        if (!tradeTypeParam) {
            return false;
        }

        // 3. Check if we've already processed this URL parameter in this session
        if (hasProcessedUrlParam(tradeTypeParam)) {
            return false;
        }

        // 4. Check workspace with retry mechanism for timing issues
        const checkWorkspaceAndShowModal = (attempt = 1, maxAttempts = 5) => {
            try {
                const currentTradeType = getCurrentTradeTypeFromWorkspace();

                if (currentTradeType) {
                    // Workspace is ready, compare trade types
                    const urlCategory = tradeTypeFromUrl.tradeTypeCategory;
                    const urlType = tradeTypeFromUrl.tradeType;
                    const workspaceCategory = currentTradeType.tradeTypeCategory;
                    const workspaceType = currentTradeType.tradeType;

                    if (workspaceCategory === urlCategory && workspaceType === urlType) {
                        // Trade types are identical, mark as processed and don't show modal
                        markUrlParamAsProcessed(tradeTypeParam);
                        return false;
                    }

                    // Trade types are different, show modal
                    showModalWithData(currentTradeType);
                    return true;
                } else if (attempt < maxAttempts) {
                    // Workspace not ready yet, retry after delay
                    setTimeout(() => {
                        checkWorkspaceAndShowModal(attempt + 1, maxAttempts);
                    }, 200); // 200ms delay between attempts
                    return true; // Indicate we're handling it
                } else {
                    // Max attempts reached, show modal anyway (workspace might not be available)
                    showModalWithData(null);
                    return true;
                }
            } catch (workspaceError) {
                console.warn(
                    'Error getting current trade type from workspace (attempt ' + attempt + '):',
                    workspaceError
                );
                if (attempt < maxAttempts) {
                    setTimeout(() => {
                        checkWorkspaceAndShowModal(attempt + 1, maxAttempts);
                    }, 200);
                    return true;
                } else {
                    showModalWithData(null);
                    return true;
                }
            }
        };

        // Helper function to show modal with data
        const showModalWithData = (currentTradeType: { tradeTypeCategory: string; tradeType: string } | null) => {
            const displayName = getTradeTypeDisplayName(tradeTypeParam);

            // Get current trade type display name for the modal
            let currentTradeTypeDisplayName = 'N/A';
            try {
                currentTradeTypeDisplayName = currentTradeType
                    ? getInternalTradeTypeDisplayName(currentTradeType.tradeTypeCategory, currentTradeType.tradeType)
                    : 'N/A';
            } catch (displayNameError) {
                console.warn('Error getting display name for current trade type:', displayNameError);
            }

            showTradeTypeConfirmationModal(
                {
                    ...tradeTypeFromUrl,
                    displayName,
                    urlParam: tradeTypeParam,
                    currentTradeType: currentTradeType,
                    currentTradeTypeDisplayName: currentTradeTypeDisplayName,
                },
                () => {
                    try {
                        // Mark as processed when user confirms
                        markUrlParamAsProcessed(tradeTypeParam);
                        onConfirm();
                    } catch (confirmError) {
                        console.warn('Error in onConfirm callback:', confirmError);
                    }
                },
                () => {
                    try {
                        // Mark as processed when user cancels
                        markUrlParamAsProcessed(tradeTypeParam);
                        onCancel();
                    } catch (cancelError) {
                        console.warn('Error in onCancel callback:', cancelError);
                    }
                }
            );
        };

        // Start the workspace check with retry mechanism
        return checkWorkspaceAndShowModal();
    } catch (error) {
        console.warn('Error in checkAndShowTradeTypeModal:', error);
        return false;
    }
};
