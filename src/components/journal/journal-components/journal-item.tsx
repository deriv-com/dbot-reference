// Removed unused React import - React 17+ JSX transform doesn't require it
import { useState } from 'react';
import classnames from 'classnames';
import DOMPurify from 'dompurify';
import { MessageTypes } from '@/external/bot-skeleton';
import { isDbotRTL } from '@/external/bot-skeleton/utils/workspace';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { TJournalItemExtra, TJournalItemProps } from '../journal.types';
import DateItem from './date-item';
import FormatMessage from './format-message';
import JournalStatsModal from './journal-stats-modal';

const getJournalItemContent = (
    message: string | ((value: () => void) => string),
    type: string,
    className: string,
    extra: TJournalItemExtra,
    measure: () => void,
    is_dark_theme: boolean,
    isModalOpen?: boolean,
    toggleModal?: () => void
) => {
    switch (type) {
        case MessageTypes.SUCCESS: {
            return <FormatMessage logType={message as string} extra={extra} className={className} />;
        }
        case MessageTypes.NOTIFY: {
            if (typeof message === 'function') {
                return <div className={classnames('journal__text', className)}>{message(measure)}</div>;
            }
            const messageStr = message as string;
            if (typeof messageStr !== 'string') {
                return <div className={classnames('journal__text', className)}>{message}</div>;
            }
            const isStatCount = messageStr?.includes('stat-count');

            // Using DOMPurify.sanitize to prevent XSS attacks by sanitizing untrusted HTML
            // This security measure ensures that any malicious scripts in messageStr are removed
            // before being inserted into the DOM via dangerouslySetInnerHTML
            return (
                <div className={classnames('journal__text', className)}>
                    <div
                        className='journal__text-content'
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(messageStr) }}
                    />
                    {isStatCount && toggleModal && isModalOpen !== undefined && (
                        <JournalStatsModal
                            is_modal_open={isModalOpen}
                            toggleModal={toggleModal}
                            title={localize('Stats')}
                            is_dark_theme={is_dark_theme}
                        />
                    )}
                </div>
            );
        }
        case MessageTypes.ERROR: {
            return <div className='journal__text--error journal__text'>{message as string}</div>;
        }
        default:
            return null;
    }
};

const JournalItem = ({ row, measure }: TJournalItemProps) => {
    const { date, time, message, message_type, className, extra } = row;
    const date_el = DateItem({ date, time });
    const { ui } = useStore();

    // Move the useState hook to the component level
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <div>
            <div className='list__animation' data-testid='mock-css-transition'>
                <div className='journal__item' dir={isDbotRTL() ? 'rtl' : 'ltr'}>
                    <div className='journal__item-content'>
                        {getJournalItemContent(
                            message,
                            message_type,
                            className,
                            extra as TJournalItemExtra,
                            measure,
                            ui.is_dark_mode_on,
                            isModalOpen,
                            toggleModal
                        )}
                    </div>
                    <div className='journal__text-datetime'>{date_el}</div>
                </div>
            </div>
        </div>
    );
};

export default JournalItem;
