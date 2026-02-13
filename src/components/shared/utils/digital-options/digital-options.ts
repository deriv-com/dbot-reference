type TMessage = {
    title: string;
    text: string;
    link: string;
};

type TShowError = {
    message: string;
    header: string;
    redirect_label: string;
    redirectOnClick?: (() => void) | null;
    should_show_refresh: boolean;
    redirect_to: string;
    should_clear_error_on_click: boolean;
    should_redirect?: boolean;
};

export const showDigitalOptionsUnavailableError = (
    showError: (t: TShowError) => void,
    message: TMessage,
    redirectOnClick?: (() => void) | null,
    should_redirect?: boolean,
    should_clear_error_on_click = true
) => {
    const { title, text, link } = message;
    showError({
        message: text,
        header: title,
        redirect_label: link,
        redirectOnClick,
        should_show_refresh: false,
        redirect_to: '/',
        should_clear_error_on_click,
        should_redirect,
    });
};

export const isEuResidenceWithOnlyVRTC = () => {
    // Always return false - EU restrictions now handled by backend
    return false;
};
