import { v4 as uuidv4 } from 'uuid';
import { arrayAsMessage, messageWithButton } from '@/components/notify-item';
import { localize } from '@deriv-com/translations';

const showErrorMessageWithButton = (message, block_id, showErrorMessage, centerAndHighlightBlock) => {
    showErrorMessage(
        messageWithButton({
            unique_id: block_id,
            type: 'error',
            message,
            btn_text: localize('Go to block'),
            onClick: () => {
                centerAndHighlightBlock();
            },
        })
    );
};

export const isCustomJournalMessage = (
    { message, block_id, variable_name },
    showErrorMessage,
    centerAndHighlightBlock,
    pushMessage,
    isStatNotification
) => {
    // notify undefined variable block
    if (message === undefined && variable_name != null) {
        showErrorMessageWithButton(
            localize(
                "Variable '{{variable_name}}' has no value. Please set a value for variable '{{variable_name}}' to notify.",
                { variable_name }
            ),
            block_id,
            showErrorMessage,
            centerAndHighlightBlock
        );
        return true;
    }
    // notify null variable block
    if (message === null) {
        pushMessage('NULL');
        return true;
    }
    // notify NaN variable block
    if (Object.is(message, NaN)) {
        showErrorMessageWithButton(
            localize('Tried to perform an invalid operation.'),
            block_id,
            showErrorMessage,
            centerAndHighlightBlock
        );
        return true;
    }
    // notify list block
    if (Array.isArray(message)) {
        const message_length = message.length;
        const parsedArray = {
            header:
                variable_name !== 'null'
                    ? `${variable_name}: (${message_length})`
                    : localize('List: ({{message_length}})', { message_length }),
            content: parseArray(message),
        };
        pushMessage(arrayAsMessage(parsedArray));
        return true;
    }
    // notify boolean results
    if (typeof message === 'boolean') {
        pushMessage(message.toString());
        return true;
    }
    if (isStatNotification) {
        // Create localized strings separately first
        const waitingText = localize('Waiting for the stat to be reset before proceeding with the order.');
        const statsText = localize('Stats');

        // Combine with HTML for formatting - send direct HTML string with SVG icon
        const statusMessage = `
        <div key="stat-count-${uuidv4()}">${waitingText}</div>
        <span>
            <strong>${statsText}</strong>&nbsp;&nbsp;|&nbsp;&nbsp;${message}
        </span>
    `;

        pushMessage(statusMessage);
        return true;
    }

    return false;
};

const parseArray = message => {
    return message.map((item, idx: number) => {
        return {
            id: `${Date.now()}-${idx}`,
            value: item && Array.isArray(item) ? parseArray(item) : item,
        };
    });
};
