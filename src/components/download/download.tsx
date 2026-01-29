import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { downloadFile, getSuccessJournalMessage } from '@/utils/download';
import { getSymbolDisplayNameSync } from '@/utils/symbol-display-name';
import { Localize, localize } from '@deriv-com/translations';
import Button from '../shared_ui/button';
import Popover from '../shared_ui/popover';

type TDownloadProps = {
    tab: string;
};

const Download = observer(({ tab }: TDownloadProps) => {
    const { run_panel, transactions, journal } = useStore();
    const { is_clear_stat_disabled, is_running } = run_panel;
    const { filtered_messages } = journal;
    const { transactions: transaction_list } = transactions;
    let disabled = false;
    let clickFunction, popover_message;

    const downloadTransaction = () => {
        const items = [
            [
                localize('Market'),
                localize('Reference ID (buy)'),
                localize('Reference ID (sell)'),
                localize('Barrier'),
                localize('Start Time'),
                localize('Entry Spot'),
                localize('Entry Spot Time'),
                localize('Exit Spot'),
                localize('Exit Spot Time'),
                localize('Buy Price'),
                localize('Profit/Loss'),
            ],
        ];
        transaction_list.forEach((transaction: any) => {
            const data = transaction.data || transaction;
            if (typeof data === 'string') return;

            // Handle both old and new API structures
            const market_name = data.display_name || getSymbolDisplayNameSync(data.underlying_symbol || '');

            // Transaction IDs - new API structure
            const buy_ref_id = String(data.transaction_ids?.buy || data.id || '');
            const sell_ref_id = String(data.transaction_ids?.sell || '');

            // Barrier
            const barrier = String(data.barrier || '');

            // Start Time - new API uses purchase_time
            const start_time = data.purchase_time
                ? new Date(data.purchase_time * 1000).toISOString().replace('T', ' ').replace('Z', ' GMT')
                : String(data.date_start || '');

            // Entry Spot
            const entry_spot = String(data.entry_spot || '');

            // Entry Spot Time - new API uses entry_spot_time
            const entry_spot_time = data.entry_spot_time
                ? new Date(data.entry_spot_time * 1000).toISOString().replace('T', ' ').replace('Z', ' GMT')
                : String(data.entry_tick_time || '');

            // Exit Spot
            const exit_spot = String(data.exit_spot || '');

            // Exit Spot Time - new API might use different field
            const exit_spot_time = data.exit_spot_time
                ? new Date(data.exit_spot_time * 1000).toISOString().replace('T', ' ').replace('Z', ' GMT')
                : String(data.exit_tick_time || '');

            // Buy Price
            const buy_price = String(data.buy_price || '');

            // Profit/Loss
            const profit_loss = String(data.profit || '');

            items.push([
                market_name,
                buy_ref_id,
                sell_ref_id,
                barrier,
                start_time,
                entry_spot,
                entry_spot_time,
                exit_spot,
                exit_spot_time,
                buy_price,
                profit_loss,
            ]);
        });

        const content = items.map(e => e.join(',')).join('\n');
        downloadFile(localize('Transactions'), content);
    };

    const downloadJournal = () => {
        const items = [[localize('Date'), localize('Time'), localize('Message')]];

        filtered_messages.map(item => {
            let array_message;
            if (item.message_type !== 'success') {
                const message = item.message;
                array_message = typeof message === 'string' ? message : JSON.stringify(message);
            } else {
                array_message = getSuccessJournalMessage(item.message.toString(), {
                    ...item.extra,
                    profit: String(item.extra?.profit || ''),
                });
            }

            // Single sanitization pass for all messages
            const sanitizedMessage = String(array_message?.replace('&#x2F;', '/') || '')
                .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
                .replace(/<[^>]*>/g, ' ') // Strip all HTML tags
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim(); // Trim extra spaces

            const arr = [String(item.date || ''), String(item.time || ''), sanitizedMessage];
            items.push(arr);
        });
        const content = items.map(e => e.join(',')).join('\n');
        downloadFile(localize('Journal'), content);
    };

    if (tab === 'transactions') {
        clickFunction = downloadTransaction;
        disabled = !transaction_list.length || is_running;
        popover_message = localize('Download your transaction history.');
        if (!transaction_list.length) popover_message = localize('No transaction or activity yet.');
    } else if (tab === 'journal') {
        clickFunction = downloadJournal;
        popover_message = localize('Download your journal.');
        disabled = is_clear_stat_disabled;
        if (disabled) popover_message = localize('No transaction or activity yet.');
    }
    if (is_running) popover_message = localize('Download is unavailable while your bot is running.');

    return (
        <Popover
            className='run-panel__info'
            classNameBubble='run-panel__info--bubble'
            alignment='bottom'
            message={popover_message}
            zIndex='5'
        >
            <Button
                id='download-button'
                disabled={disabled}
                className='download__button'
                onClick={clickFunction}
                secondary
            >
                <Localize i18n_default_text='Download' />
            </Button>
        </Popover>
    );
});

export default Download;
