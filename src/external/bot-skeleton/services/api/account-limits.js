import { getAccountLimits } from '../../../../components/shared/utils/common-data';

export default class AccountLimits {
    constructor(store) {
        this.ws = store.ws;
    }
    // eslint-disable-next-line default-param-last
    getStakePayoutLimits(currency = 'USD', selected_market) {
        // Use common data instead of duplicating here
        return getAccountLimits(currency, selected_market);
    }
}
