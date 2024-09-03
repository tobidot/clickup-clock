import * as z from 'zod';

/**
 * @see https://clickup.com/api
 */
export class ClickUpApi {

    protected token: string | null = null;
    protected team_id: string | null = null;

    public set_team_id(team_id: string) {
        this.team_id = team_id;
    }

    public set_token(token: string) {
        this.token = token;
    }


    public async get_team() {
        if (this.token === null) {
            throw new Error('Token or Team ID not set');
        }
        const resp = await fetch(
            `https://api.clickup.com/api/v2/team`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.token,
                }
            }
        );
        return await resp.json();
    }


    /**
     * 
     * @param start_time 
     * @param end_time 
     * @returns 
     * @see https://clickup.com/api/clickupreference/operation/Gettimeentrieswithinadaterange/
     */
    public async get_time_trackings(
        start_time: number,
        end_time: number,
    ): Promise<z.infer<typeof time_tracking_response_schema>> {
        if (this.token === null || this.team_id === null) {
            throw new Error('Token or Team ID not set');
        }



        // Create a Date object for the 29th of August 2024
        let startDate = new Date('2024-08-29T00:00:00Z'); // Start of the day (00:00:00 UTC)
        let endDate = new Date('2024-08-29T23:59:59Z'); // End of the day (23:59:59 UTC)

        let dateInput = document.getElementById('newDate') as HTMLInputElement;
        let fetchValue = dateInput.value;
        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        let yyyy = today.getFullYear();
        let dateValue = yyyy + '-' + mm + '-' + dd;

        if (dateInput.value) {
            dateValue = dateInput.value;
        }

        startDate = new Date(dateValue + "T00:00:00Z");
        endDate = new Date(dateValue + "T23:59:59Z");

        // Convert the Date object to Unix timestamp (milliseconds since epoch)
        start_time = startDate.getTime();
        end_time = endDate.getTime();

        const query = new URLSearchParams({
            start_date: start_time.toString(),
            end_date: end_time.toString(),
        }).toString();

        const teamId = this.team_id;
        const resp = await fetch(
            `https://api.clickup.com/api/v2/team/${teamId}/time_entries?${query}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.token,
                }
            }
        );

        const data = await resp.json();
        console.log(data);
        return time_tracking_response_schema.parse(data);
    }
}

export const task_schema = z.object({
    id: z.string(),
    name: z.string(),
});

export const time_tracking_schema = z.object({
    id: z.string(),
    task: task_schema,
    billable: z.boolean(),
    start: z.string(),
    end: z.string(),
    duration: z.string(),
    description: z.string().optional(),
});

export const time_tracking_response_schema = z.object({
    data: z.array(time_tracking_schema),
});