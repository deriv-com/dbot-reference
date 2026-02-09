export type TBlocklyEvents = {
    type: string;
    element: string;
    group: string;
    oldValue: string;
    blockId: string;
};

// Define Blockly types for consistent usage across the application
export interface BlocklyBlock {
    type: string;
    getFieldValue: (fieldName: string) => string;
    setFieldValue: (value: string, fieldName: string) => void;
    getChildByType: (type: string) => BlocklyBlock | null;
}

export interface BlocklyWorkspace {
    getAllBlocks: () => BlocklyBlock[];
    addChangeListener: (listener: (event: BlocklyEvent) => void) => void;
    removeChangeListener: (listener: (event: BlocklyEvent) => void) => void;
    render: () => void;
}

export interface BlocklyEvent {
    type: string;
    element?: string;
    name?: string;
    oldValue?: string;
    newValue?: string;
}

export interface BlocklyEvents {
    BlockChange: new (
        block: BlocklyBlock,
        element: string,
        name: string,
        oldValue: string,
        newValue: string
    ) => BlocklyEvent;
    fire: (event: BlocklyEvent) => void;
    setGroup: (group: string) => void;
    getGroup: () => string;
}

// Extended Blockly type definitions for XML manipulation, utilities, and workspace methods
export interface BlocklyXml {
    domToText: (dom: Element | Document) => string;
    domToBlock: (dom: Element, workspace: any) => any;
    domToWorkspace: (dom: Element | Document, workspace: any) => any;
    workspaceToDom: (workspace: any, opt_noId?: boolean) => Element;
    clearWorkspaceAndLoadFromXml: (dom: Element | Document, workspace: any) => void;
    domToPrettyText: (dom: Element | Document) => string;
    domToVariables: (dom: Element, workspace: any) => void;
    blockToDom: (block: any) => Element;
    textToDom: (text: string) => Document;
    NODE_BLOCK: string;
    NODE_LABEL: string;
    NODE_INPUT: string;
    NODE_BUTTON: string;
}

export interface BlocklyUtils {
    xml: {
        textToDom: (text: string) => Document;
    };
    idGenerator: {
        genUid: () => string;
    };
    dom: {
        hasClass: (element: Element, className: string) => boolean;
        addClass: (element: Element, className: string) => void;
        removeClass: (element: Element, className: string) => void;
    };
    string: {
        wrap: (text: string, limit: number) => string;
    };
}

export interface ExtendedBlocklyWorkspace extends BlocklyWorkspace {
    addBlockNode: (blockNode: Element | null) => void;
    strategy_to_load?: string;
    current_strategy_id?: string;
    cached_xml?: {
        main: string;
    };
}

// Extend the Window interface to include Blockly types
declare global {
    interface Window {
        Blockly: {
            derivWorkspace?: ExtendedBlocklyWorkspace;
            Events: BlocklyEvents;
            Xml: BlocklyXml;
            utils: BlocklyUtils;
            Tooltip?: {
                LIMIT: number;
            };
            WorkspaceSvg?: any;
        };
    }
}
