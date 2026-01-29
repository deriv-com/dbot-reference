import React from 'react';
import StreamIframe from '@/components/shared/stream-iframe/stream-iframe';
import Modal from '@/components/shared_ui/modal';
import Text from '@/components/shared_ui/text/text';
import { getJournalStatsVideoId } from '@/constants/video-config';
import { LegacyInfo1pxIcon } from '@deriv/quill-icons/Legacy';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import './journal-stats-modal.scss';

type TJournalStatsModalProps = {
    icon_classname?: string;
    is_dark_theme?: boolean;
    is_modal_open: boolean;
    title: string;
    toggleModal: () => void;
};

const JournalStatsModal = ({ is_dark_theme = false, is_modal_open, title, toggleModal }: TJournalStatsModalProps) => {
    const video_id = getJournalStatsVideoId(is_dark_theme);
    const { isDesktop } = useDevice();

    return (
        <React.Fragment>
            <LegacyInfo1pxIcon
                onClick={toggleModal}
                iconSize='xs'
                fill='#85ACB0'
                className={`info-icon`}
                data-testid='dt_ic_info_icon'
            />
            <Modal
                is_open={is_modal_open}
                should_header_stick_body={false}
                title={title}
                toggleModal={toggleModal}
                width='600px'
                className='journal-stats-modal'
                has_close_icon={true}
            >
                <Modal.Body className='journal-stats-modal-body'>
                    <div className='journal-stats-modal-body__video'>
                        <StreamIframe
                            src={video_id}
                            title='journal_stats_manual'
                            autoplay
                            loop
                            muted
                            data-testid='dt_journal_stats_manual_video'
                        />
                    </div>
                    <div className='journal-modal__content'>
                        <Text
                            as='p'
                            size={isDesktop ? 's' : 'xs'}
                            color='prominent'
                            className='journal-stats-modal-body__text'
                        >
                            {localize(
                                'Stats show the history of consecutive tick counts, i.e. the number of ticks the price remained within range continuously.'
                            )}
                        </Text>
                    </div>
                </Modal.Body>
            </Modal>
        </React.Fragment>
    );
};

export default JournalStatsModal;
