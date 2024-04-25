import { z } from "zod";
import { ClickUpApi, time_tracking_schema } from "./ClickUpApi";
import { ChartBuiler as ChartBuilder, ChartTrackingData } from "./ChartBuilder";
import { get_element_by_query_selector } from "@game.object/ts-game-toolbox";

export class App {

    private clickUpApi: ClickUpApi;
    private chartBuilder: ChartBuilder;
    private trackings: Array<z.infer<typeof time_tracking_schema>> = [];

    public constructor(
        private $root: HTMLElement,
        private $token: HTMLInputElement,
        private $table: HTMLTableElement,
        private $refresh: HTMLButtonElement,
        private $chart: SVGElement,
    ) {
        console.log('App constructor');
        this.clickUpApi = new ClickUpApi();
        this.chartBuilder = new ChartBuilder(this.$chart, this.on_chart_click, this.on_chart_overlap_click);
        this.$token.addEventListener('change', this.on_token_change);
        this.$refresh.addEventListener('click', this.on_refresh_click);

    }


    public on_chart_click = (tracking: ChartTrackingData) => {
        console.log('on_chart_click', tracking);
        this.select_entry(tracking.id);
    };

    public on_chart_overlap_click = (previousTracking: ChartTrackingData, nextTracking: ChartTrackingData) => {
        console.log('on_chart_overlap_click');
        console.log('on_chart_click', previousTracking);
        console.log('on_chart_click', nextTracking);
    };

    public select_entry(tracking_id: string) {
        try {
            document.querySelectorAll('.tracking').forEach((tracking) => {
                tracking.classList.remove('selected');
                if ((tracking instanceof HTMLElement || tracking instanceof SVGElement) && tracking.dataset.trackingId === tracking_id) {
                    tracking.classList.add('selected');
                    if (tracking instanceof SVGElement) {
                        // move it to the top
                        tracking.parentElement?.appendChild(tracking);
                    }
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    public on_token_change = () => {
        this.clickUpApi.set_token(this.get_token());
    }

    public on_refresh_click = () => {
        ((async () => {
            const team = await this.clickUpApi.get_team();
            this.clickUpApi.set_team_id(team.teams[0].id);
            const now_timestamp = Date.now();
            const start_of_day_timestamp = new Date(now_timestamp).setHours(0, 0, 0, 0);
            const time_trackings = await this.clickUpApi.get_time_trackings(
                start_of_day_timestamp,
                now_timestamp
            )
            const sorted_time_trackings = this.trackings = time_trackings.data.sort((
                a: z.infer<typeof time_tracking_schema>,
                b: z.infer<typeof time_tracking_schema>,
            ) => {
                return Number.parseInt(a.start) - Number.parseInt(b.start);
            });
            // this.dump(time_trackings);

            const tableBody = this.$table.tBodies[0];
            tableBody.innerHTML = '';


            const proto_rows = sorted_time_trackings.map((tracking: z.infer<typeof time_tracking_schema>): {
                type: "time_tracking"
                tracking: z.infer<typeof time_tracking_schema>,
            } => {
                return {
                    type: "time_tracking",
                    tracking: tracking,
                };
            });

            const rows = new Array<
                {
                    type: "time_tracking"
                    tracking: z.infer<typeof time_tracking_schema>,
                } | {
                    type: "task_separator"
                    separator: {
                        time: number
                    },
                }
            >();
            let previous_task: null | z.infer<typeof time_tracking_schema> = null;
            for (const row of proto_rows) {
                if (previous_task === null) {
                    previous_task = row.tracking;
                    rows.push(row);
                    continue;
                }
                const separator = {
                    type: "task_separator",
                    separator: {
                        time: Number.parseInt(row.tracking.start) - Number.parseInt(previous_task.end),
                    }
                } as const;
                rows.push(separator);
                previous_task = row.tracking;
                rows.push(row);
            }
            console.log(rows);
            //
            rows.forEach((tracking) => {
                const row = this.render_row(tracking);
                tableBody.appendChild(row);
            });

            // 
            this.chartBuilder.set_data({
                trackings: sorted_time_trackings.map((tracking) => {
                    return {
                        id: tracking.id,
                        task_name: tracking.task.name ?? '',
                        description: tracking.description ?? '',
                        start: Number.parseInt(tracking.start),
                        end: Number.parseInt(tracking.end),
                    }
                })
            });
            this.chartBuilder.render();
        }))();

    }

    public render_row(
        row_data: {
            type: "time_tracking"
            tracking: z.infer<typeof time_tracking_schema>
        } | {
            type: "task_separator"
            separator: {
                time: number
            },
        }
    ): HTMLTableRowElement {
        if (row_data.type === 'task_separator') {
            const row = document.createElement('tr');
            const classification = (() => {
                if (Math.abs(row_data.separator.time) < 1000 * 30) {
                    // less than a minute
                    return 'short';
                }
                if (row_data.separator.time < 0) {
                    return 'negative';
                }
                if (row_data.separator.time < 1000 * 60 * 30) {
                    // less than half an hour
                    return 'medium';
                }
                // more than half an hour
                return 'long';
            })();
            row.className = [classification, 'separator'].join(' ');
            // in minutes
            const content = Math.round(row_data.separator.time / 1000 / 60).toFixed(0) + ' minutes';
            row.innerHTML = `
<td colspan="5" >${content}</td>
            `
            return row;
        }
        const start = new Date(Number.parseInt(row_data.tracking.start)).toLocaleTimeString();
        const end = new Date(Number.parseInt(row_data.tracking.end)).toLocaleTimeString();
        const duration_in_hours = (Number.parseInt(row_data.tracking.duration) / 3600 / 1000).toFixed(2) + 'h';
        const name = row_data.tracking.task.name;
        // const name = "title";
        const description = row_data.tracking.description;
        // const description = "description";
        const row = document.createElement('tr');
        row.addEventListener('click', () => {
            this.select_entry(row_data.tracking.id);
        });
        row.classList.add('tracking');
        row.dataset.trackingId = row_data.tracking.id;
        row.innerHTML = `
<td>${name}</td>
<td>${description}</td>
<td>${start}</td>
<td>${end}</td>
<td>${duration_in_hours}</td>
`;
        return row;
    }

    public dump(any: any) {
        console.log(any);
        this.$root.innerHTML = '<pre>' + JSON.stringify(any, null, 2) + '</pre>';
    }

    public get_token() {
        return this.$token.value;
    }
}