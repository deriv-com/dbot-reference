// Removed unused React import - React 17+ JSX transform doesn't require it
import Badge from '@/components/shared_ui/badge';

type TWalletBadge = {
    is_demo: boolean;
    label?: string;
};

const WalletBadge = ({ is_demo, label }: TWalletBadge) => {
    return is_demo ? (
        <Badge type='contained' background_color='blue' label='Demo' custom_color='colored-background' />
    ) : (
        <Badge type='bordered' label={label?.toUpperCase() ?? ''} />
    );
};

export default WalletBadge;
