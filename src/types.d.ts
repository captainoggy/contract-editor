interface TinyMCEEditor {
    getContent(): string;
    setContent(content: string): void;
}

interface SignatureConfig {
    width: number;
    height: number;
    borderStyle: string;
    borderWidth: number;
    borderColor: string;
    backgroundColor: string;
    lineWidth: number;
    lineColor: string;
    dialogTitle: string;
    dialogOkText: string;
    dialogCancelText: string;
    dialogClearText: string;
    dialogPenText: string;
    dialogUploadText: string;
    uploadConfig: {
        accept: string;
        maxFileSize: number;
    };
}

interface TinyMCESettings {
    selector: string;
    height: number;
    menubar: boolean;
    plugins: string[];
    toolbar: string;
    content_style: string;
    signature_config: SignatureConfig;
    powerpaste_allow_local_images: boolean;
    powerpaste_word_import: string;
    powerpaste_html_import: string;
    images_upload_handler: (blobInfo: any, progress: any) => Promise<string>;
}

interface TinyMCE {
    init(settings: Partial<TinyMCESettings>): Promise<TinyMCEEditor[]>;
}

declare var tinymce: TinyMCE; 
declare class diff_match_patch {
    diff_main(text1: string, text2: string): Array<[number, string]>;
    diff_cleanupSemantic(diffs: Array<[number, string]>): void;
}

declare interface HTMLIonButtonElement extends HTMLElement {
    disabled: boolean;
}

interface HTMLIonContentElement extends HTMLElement {
    scrollToTop(duration?: number): Promise<void>;
}

interface HTMLIonCheckboxElement extends HTMLElement {
    checked: boolean;
    indeterminate: boolean;
}

declare global {
    interface Document {
        querySelector(selector: 'ion-content'): HTMLIonContentElement | null;
    }
}

interface Position {
    start: number;
    end: number;
    contextBefore: string;
    contextAfter: string;
}

interface Change {
    id: string;
    text: string;
    oldText: string;
    lineNumber: number;
    type: 'addition' | 'deletion' | 'modification';
    status: 'pending' | 'approved' | 'rejected';
    position: Position;
    lineDiffs: Array<[number, string, string?, Position?]>;
}

interface IonChangeEvent extends CustomEvent {
    detail: {
        checked: boolean;
    };
}

declare global {
    interface HTMLElementEventMap {
        'ionChange': IonChangeEvent;
    }
} 