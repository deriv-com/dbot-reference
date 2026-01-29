import { action, makeObservable, observable, reaction } from 'mobx';
import { scrollWorkspace } from '@/external/bot-skeleton';
import { browserOptimizer } from '@/utils/browser-performance-optimizer';
import { clickRateLimiter } from '@/utils/click-rate-limiter';
import GTM from '@/utils/gtm';
import { TStores } from '@deriv/stores/types';
import { localize } from '@deriv-com/translations';
import RootStore from './root-store';

export default class ToolboxStore {
    root_store: RootStore;
    core: TStores;
    disposeToolboxToggleReaction: (() => void) | undefined = undefined;
    typing_timer: ReturnType<typeof setTimeout> | undefined = undefined;
    click_debounce_timer: ReturnType<typeof setTimeout> | undefined = undefined;
    last_clicked_category: string | null = null;
    workspace_adjust_timer: ReturnType<typeof setTimeout> | undefined = undefined;
    is_adjusting_workspace = false;
    constructor(root_store: RootStore, core: TStores) {
        makeObservable(this, {
            is_toolbox_open: observable,
            is_search_loading: observable,
            is_search_focus: observable,
            sub_category_index: observable,
            toolbox_dom: observable,
            toolbox_examples: observable,
            onMount: action.bound,
            onUnmount: action.bound,
            setWorkspaceOptions: action.bound,
            adjustWorkspace: action.bound,
            toggleDrawer: action.bound,
            onToolboxItemClick: action.bound,
            onToolboxItemExpand: action.bound,
            getCategoryContents: action.bound,
            getAllCategories: action.bound,
            hasSubCategory: action.bound,
            onSearch: action.bound,
            onSearchBlur: action.bound,
            onSearchClear: action.bound,
            onSearchKeyUp: action.bound,
            showSearch: action.bound,
        });

        this.root_store = root_store;
        this.core = core;
    }

    is_toolbox_open = true;
    is_search_loading = false;
    is_search_focus = false;
    sub_category_index: number[] = [];
    toolbox_dom: HTMLElement | undefined = undefined;
    toolbox_examples: HTMLElement | undefined = undefined;
    is_workspace_scroll_adjusted = false;

    onMount = (toolbox_ref: React.RefObject<HTMLDivElement>) => {
        this.adjustWorkspace();

        this.toolbox_dom = window.Blockly.utils.xml.textToDom(toolbox_ref?.current);
        const el = [...(this.toolbox_dom?.childNodes ?? [])].find(
            el => el instanceof HTMLElement && el.tagName === 'examples'
        );
        if (el) this.toolbox_examples = el as HTMLElement;
        this.setWorkspaceOptions();
        this.disposeToolboxToggleReaction = reaction(
            () => this.is_toolbox_open,
            is_toolbox_open => {
                if (is_toolbox_open) {
                    // Emit event to GTM
                    GTM?.pushDataLayer?.({ event: 'dbot_toolbox_visible', value: true });
                }
            }
        );
    };

    onUnmount() {
        if (typeof this.disposeToolboxToggleReaction === 'function') {
            this.disposeToolboxToggleReaction();
        }
        // Clean up timers to prevent memory leaks
        if (this.typing_timer) {
            clearTimeout(this.typing_timer);
            this.typing_timer = undefined;
        }
        if (this.click_debounce_timer) {
            clearTimeout(this.click_debounce_timer);
            this.click_debounce_timer = undefined;
        }
        if (this.workspace_adjust_timer) {
            clearTimeout(this.workspace_adjust_timer);
            this.workspace_adjust_timer = undefined;
        }
    }

    setWorkspaceOptions() {
        const workspace = window.Blockly.derivWorkspace;
        const readOnly = !!workspace.options.readOnly;
        let languageTree, hasCategories, hasCollapse, hasComments, hasDisable;

        if (readOnly) {
            languageTree = null;
            hasCategories = false;
            hasCollapse = false;
            hasComments = false;
            hasDisable = false;
        } else {
            languageTree = this.toolbox_dom;
            hasCategories = Boolean(languageTree && languageTree.getElementsByTagName('category').length);
            hasCollapse = hasCategories;
            hasComments = hasCategories;
            hasDisable = hasCategories;
        }

        workspace.options.collapse = hasCollapse;
        workspace.options.comments = hasComments;
        workspace.options.disable = hasDisable;
        workspace.options.hasCategories = hasCategories;
        workspace.options.languageTree = languageTree;
    }
    // eslint-disable-next-line class-methods-use-this
    adjustWorkspace() {
        // Throttle workspace adjustments to prevent excessive calculations
        if (this.is_adjusting_workspace) {
            return;
        }

        if (this.workspace_adjust_timer) {
            clearTimeout(this.workspace_adjust_timer);
        }

        // Browser-specific throttle delay (Safari/Firefox)
        const throttleDelay = browserOptimizer.getThrottleDelay();

        this.workspace_adjust_timer = setTimeout(() => {
            this.performWorkspaceAdjustment();
        }, throttleDelay);
    }

    private performWorkspaceAdjustment() {
        // NOTE: added this load modal open check to prevent scroll when load modal is open
        if (!this.is_workspace_scroll_adjusted && !this.root_store.load_modal.is_load_modal_open) {
            this.is_adjusting_workspace = true;
            this.is_workspace_scroll_adjusted = true;

            setTimeout(() => {
                const workspace = window.Blockly.derivWorkspace;
                const toolbox_width = document.getElementById('gtm-toolbox')?.getBoundingClientRect().width || 0;
                const block_canvas_rect = workspace.svgBlockCanvas_?.getBoundingClientRect(); // eslint-disable-line

                if (workspace.RTL && block_canvas_rect) {
                    const is_mobile = this.core.ui.is_mobile;
                    const block_canvas_space = is_mobile ? block_canvas_rect.right : block_canvas_rect.left;

                    const scroll_distance_mobile = toolbox_width - block_canvas_space + 20;
                    const scroll_distance_desktop = toolbox_width - block_canvas_space + 36;
                    const scroll_distance = this.core.ui.is_mobile ? scroll_distance_mobile : scroll_distance_desktop;

                    if (Math.round(block_canvas_space) <= toolbox_width || is_mobile) {
                        scrollWorkspace(workspace, scroll_distance, true, false);
                    }
                } else if (Math.round(block_canvas_rect?.left) <= toolbox_width) {
                    const scroll_distance = this.core.ui.is_mobile
                        ? toolbox_width - block_canvas_rect.left + 50
                        : toolbox_width - block_canvas_rect.left + 36;
                    scrollWorkspace(workspace, scroll_distance, true, false);
                }

                this.is_workspace_scroll_adjusted = false;
                this.is_adjusting_workspace = false;
            }, 300);
        }
    }

    toggleDrawer() {
        this.is_toolbox_open = !this.is_toolbox_open;
    }

    onToolboxItemClick(category: HTMLElement) {
        const category_id = category.getAttribute('id');
        const { flyout } = this.root_store;

        // Handle toolbar click independently - immediate response
        if (flyout.selected_category?.getAttribute('id') === category_id) {
            flyout.setVisibility(false);
            return;
        }

        // Set selection immediately for visual feedback
        flyout.setSelectedCategory(category);
        flyout.setVisibility(true);

        // Load flyout content after selection is complete
        setTimeout(() => {
            this.loadFlyoutContent(category);
        }, 0);
    }

    private loadFlyoutContent(category: HTMLElement) {
        const { flyout } = this.root_store;

        const flyout_content = this.getCategoryContents(category) as Element[];
        flyout.setIsSearchFlyout(false);
        flyout.setContents(flyout_content);
    }

    onToolboxItemExpand(index: number) {
        // Global rate limiting to prevent Safari freezing
        if (!clickRateLimiter.canClick()) {
            console.warn('Click rate limit exceeded, ignoring expand');
            return;
        }

        // Prevent rapid expand/collapse operations
        if (this.click_debounce_timer) {
            return;
        }

        // Browser-specific debounce delay (Safari/Firefox)
        const debounceDelay = browserOptimizer.getDebounceDelay();

        this.click_debounce_timer = setTimeout(() => {
            this.click_debounce_timer = undefined;
        }, debounceDelay);

        // Browser-specific DOM operation (Safari/Firefox)
        browserOptimizer.safeDOMOperation(() => {
            if ((this.sub_category_index as number[]).includes(index)) {
                const open_ids = this.sub_category_index.filter(open_id => open_id !== index);
                this.sub_category_index = open_ids;
            } else {
                this.sub_category_index = [...this.sub_category_index, index];
            }
        });
    }

    getCategoryContents = (category: HTMLElement): ChildNode[] => {
        const workspace = window.Blockly.derivWorkspace;
        const dynamic = category.getAttribute('dynamic');
        let xml_list = Array.from(category.childNodes);

        // Dynamic categories
        if (typeof dynamic === 'string') {
            let fnToApply = workspace.getToolboxCategoryCallback(dynamic);
            //we needed to add this check since we are not using
            //blocky way of defining vaiables
            if (dynamic === 'VARIABLE') {
                fnToApply = window.Blockly.DataCategory;
            }
            xml_list = fnToApply(workspace);
        }
        return xml_list;
    };

    getAllCategories = (): ChildNode[] => {
        const categories: ChildNode[] = [];
        Array.from((this.toolbox_dom as HTMLElement).childNodes).forEach((category: ChildNode) => {
            categories.push(category);
            if (this.hasSubCategory((category as HTMLElement).children)) {
                Array.from((category as HTMLElement).children).forEach(subCategory => {
                    categories.push(subCategory);
                });
            }
        });
        return categories;
    };

    hasSubCategory = (category: HTMLElement[]) => {
        const subCategory = Object.keys(category).filter(key => {
            if (category[Number(key)].tagName.toUpperCase() === 'CATEGORY') {
                return category[Number(key)];
            }
        });
        if (subCategory.length) {
            return true;
        }
        return false;
    };

    onSearch = (values: any) => {
        const search = values?.search || '';
        this.is_search_focus = true;
        this.showSearch(search);
    };

    onSearchBlur() {
        this.is_search_focus = false;
    }

    onSearchClear(setFieldValue: (field: string, value: string) => void) {
        setFieldValue('search', '');
        this.showSearch('');
    }

    onSearchKeyUp(submitForm: () => void) {
        this.is_search_loading = true;

        clearTimeout(this.typing_timer);
        this.typing_timer = setTimeout(
            action(() => {
                submitForm();
                this.is_search_loading = false;
            }),
            1000
        );
    }

    showSearch = (search: string) => {
        const workspace = window.Blockly.derivWorkspace;
        const flyout_content: HTMLElement[] = [];
        const search_term = search.replace(/\s+/g, ' ').trim().toUpperCase();
        const search_words = search_term.split(' ');
        const all_variables = workspace.getVariablesOfType('');
        const all_procedures = window.Blockly.Procedures.allProcedures(workspace);
        const { flyout } = this.root_store;

        // avoid general term which the result will return most of the blocks
        const general_term = [
            localize('THE'),
            localize('OF'),
            localize('YOU'),
            localize('IS'),
            localize('THIS'),
            localize('THEN'),
            localize('A'),
            localize('AN'),
        ];

        if (search_term.length === 0) {
            return;
        } else if (search_term.length <= 1 || search_words.every(term => general_term.includes(term))) {
            flyout.setIsSearchFlyout(true);
            flyout.setContents(flyout_content, search);
            return;
        }

        const all_categories = this.getAllCategories();

        const block_contents = all_categories
            .filter(category => !this.hasSubCategory(category.children))
            .map(category => {
                const contents = this.getCategoryContents(category as HTMLElement);

                const only_block_contents = Array.from(contents).filter(
                    content => content.tagName.toUpperCase() === 'BLOCK'
                );
                return only_block_contents;
            })
            .flat();

        const pushIfNotExists = (array: any[] = [], element_to_push = {}) => {
            if (!array.some(element => element === element_to_push)) {
                array.push(element_to_push);
            }
        };

        const pushBlockWithPriority = (priority: string) => {
            block_contents.forEach(block_content => {
                const block_type = block_content.getAttribute('type');
                const block = window.Blockly.Blocks[block_type];
                const block_meta = block.meta instanceof Function && block.meta();
                const block_definitions = block.definition instanceof Function && block.definition();
                const block_name = block_meta.display_name;
                const block_type_terms = block_type.toUpperCase().split('_');
                const block_name_terms = block_name.toUpperCase().split(' ');
                const definition_key_to_search = /^((message)|(tooltip)|(category))/;

                switch (priority) {
                    // when the search text match exactly the block's name
                    case 'exact_block_name': {
                        if (search_term === block_name.toUpperCase() || search_term === block_type.toUpperCase()) {
                            pushIfNotExists(flyout_content, block_content);
                        }
                        break;
                    }
                    // when there's multiple search text and all the search text match block's name or block type
                    case 'match_words': {
                        if (
                            search_words.every(word => block_name_terms.some((term: string) => term.includes(word))) ||
                            search_words.every(word => block_type_terms.some((term: string) => term.includes(word)))
                        ) {
                            pushIfNotExists(flyout_content, block_content);
                        }
                        break;
                    }
                    // when some of search word match block's name or block's type
                    case 'block_term': {
                        if (
                            block_type_terms.some((term: string) => search_words.some(word => term.includes(word))) ||
                            block_name_terms.some((term: string) => search_words.some(word => term.includes(word)))
                        ) {
                            pushIfNotExists(flyout_content, block_content);
                        }
                        break;
                    }
                    case 'block_definitions': {
                        // eslint-disable-next-line consistent-return
                        Object.keys(block_definitions).forEach(key => {
                            const definition = block_definitions[key];

                            if (
                                definition_key_to_search.test(key) &&
                                search_words.some(word => definition.includes(word))
                            ) {
                                pushIfNotExists(flyout_content, block_content);
                            }

                            if (definition instanceof Array) {
                                definition.forEach(def => {
                                    const definition_strings = JSON.stringify(def).toUpperCase();

                                    if (
                                        def.type === 'field_dropdown' &&
                                        search_term.length > 2 &&
                                        search_words.some(word => definition_strings.includes(word))
                                    ) {
                                        pushIfNotExists(flyout_content, block_content);
                                    }
                                });
                            }
                        });
                        break;
                    }
                    case 'block_meta': {
                        // block_meta matched
                        const matched_meta = Object.keys(block_meta)
                            .filter(key => key !== 'display_name')
                            .find(key => {
                                const block_meta_strings = block_meta[key]
                                    .toUpperCase()
                                    .replace(/[^\w\s]/gi, '')
                                    .split(' ');

                                return search_words.some(word => block_meta_strings.some(meta => meta.includes(word)));
                            });

                        if (matched_meta && matched_meta.length) {
                            pushIfNotExists(flyout_content, block_content);
                        }
                        break;
                    }
                    default:
                        break;
                }
            });
        };

        const priority_order = ['exact_block_name', 'match_words', 'block_term', 'block_definitions', 'block_meta'];

        priority_order.forEach(priority => pushBlockWithPriority(priority));

        // block_variable_name matched
        const matched_variables = all_variables.filter(variable => variable.name.toUpperCase().includes(search_term));
        const variables_blocks = window.Blockly.DataCategory.search(matched_variables);
        // eslint-disable-next-line consistent-return
        const unique_var_blocks = variables_blocks.filter(variable_block => {
            return flyout_content.indexOf(variable_block) === -1;
        });
        if (unique_var_blocks && unique_var_blocks.length) {
            flyout_content.unshift(...unique_var_blocks);
        }

        // block_procedure_name matched
        const searched_procedures = { 0: [], 1: [] };
        const procedures_callnoreturn = all_procedures[0];
        const procedures_callreturn = all_procedures[1];
        Object.keys(procedures_callnoreturn).forEach(key => {
            const procedure = procedures_callnoreturn[key];

            if (procedure[0].toUpperCase().includes(search_term)) {
                searched_procedures['0'].unshift(procedure);
            }
        });

        Object.keys(procedures_callreturn).forEach(key => {
            const procedure = procedures_callreturn[key];

            if (procedure[0].toUpperCase().includes(search_term)) {
                searched_procedures['1'].unshift(procedure);
            }
        });

        const procedures_blocks = window.Blockly.Procedures.populateDynamicProcedures(searched_procedures);
        // eslint-disable-next-line consistent-return
        const unique_proce_blocks = procedures_blocks.filter(procedure_block => {
            return flyout_content.indexOf(procedure_block) === -1;
        });
        if (unique_proce_blocks.length) {
            flyout_content.unshift(...unique_proce_blocks);
        }

        flyout.setIsSearchFlyout(true);
        flyout.setContents(flyout_content, search);
        // Explicitly ensure flyout is visible after search completes
        flyout.setVisibility(true);
    };
}
