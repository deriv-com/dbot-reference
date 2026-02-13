import AppStore from './app-store';
import BlocklyStore from './blockly-store';
import ChartStore from './chart-store';
import ClientStore from './client-store';
import CommonStore from './common-store';
import DashboardStore from './dashboard-store';
import FlyoutHelpStore from './flyout-help-store';
import FlyoutStore from './flyout-store';
import GoogleDriveStore from './google-drive-store';
import JournalStore from './journal-store';
import LoadModalStore from './load-modal-store';
import QuickStrategyStore from './quick-strategy-store';
import RunPanelStore from './run-panel-store';
import SaveModalStore from './save-modal-store';
import SummaryCardStore from './summary-card-store';
import ToolbarStore from './toolbar-store';
import ToolboxStore from './toolbox-store';
import TransactionsStore from './transactions-store';
import UiStore from './ui-store';
import { TDbot } from 'Types';

export default class RootStore {
    public dbot: TDbot;
    public app: AppStore;
    public summary_card: SummaryCardStore;
    public flyout: FlyoutStore;
    public flyout_help: FlyoutHelpStore;
    public google_drive: GoogleDriveStore;
    public journal: JournalStore;
    public load_modal: LoadModalStore;
    public run_panel: RunPanelStore;
    public save_modal: SaveModalStore;
    public transactions: TransactionsStore;
    public toolbar: ToolbarStore;
    public toolbox: ToolboxStore;
    public quick_strategy: QuickStrategyStore;

    public dashboard: DashboardStore;

    public chart_store: ChartStore;
    public blockly_store: BlocklyStore;
    public ui: UiStore;
    public client: ClientStore;
    public common: CommonStore;

    core = {
        ui: {},
        client: {},
        common: {},
    };

    constructor(dbot: TDbot) {
        this.dbot = dbot;

        // Need to fix later without using this.core
        this.ui = new UiStore();
        this.client = new ClientStore();
        this.common = new CommonStore();
        this.core.ui = this.ui;
        this.core.client = this.client;
        this.core.common = this.common;

        this.app = new AppStore(this, this.core);
        this.summary_card = new SummaryCardStore(this, this.core);
        this.flyout = new FlyoutStore(this);
        this.flyout_help = new FlyoutHelpStore(this);
        this.google_drive = new GoogleDriveStore(this);
        this.journal = new JournalStore(this, this.core);
        this.load_modal = new LoadModalStore(this, this.core);
        this.run_panel = new RunPanelStore(this, this.core);
        this.save_modal = new SaveModalStore(this);
        this.transactions = new TransactionsStore(this, this.core);
        this.toolbar = new ToolbarStore(this);
        this.toolbox = new ToolboxStore(this, this.core);
        this.quick_strategy = new QuickStrategyStore(this);

        this.dashboard = new DashboardStore(this, this.core);

        // need to be at last for dependency
        this.chart_store = new ChartStore(this);
        this.blockly_store = new BlocklyStore(this);
    }
}
