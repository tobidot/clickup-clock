export interface ChartTrackingData {
    id: string;
    task_name: string;
    description: string;
    // timestamps
    start: number;
    end: number;
}

export interface ChartData {
    trackings: Array<ChartTrackingData>
}

export class ChartBuiler {

    private data: ChartData = {
        trackings: [],
    };

    constructor(
        private $svg: SVGElement,
        private on_click: (tracking: ChartTrackingData) => void,
        private on_click_overlap: (previousTracking: ChartTrackingData, nextTracking: ChartTrackingData) => void,
    ) {
    }

    public set_data(data: ChartData) {
        this.data = data;
        console.log(data);
    }

    public render(): SVGElement {
        const data = this.data;

        // Get total duration
        const timeInCircle = 1000 * 60 * 60 * 12;
        const totalDuration = data.trackings.reduce((acc, curr) => acc + (curr.end - curr.start), 0);


        // Calculate angles for a timestamp on the clock
        const timeToAngle = (timestamp: number) => {
            const ms = timestamp % timeInCircle;
            return (ms / timeInCircle) * 360;
        }

        // Create SVG
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = this.$svg;
        // set the viewbox to 200x200 to make the circle fit into the
        svg.setAttribute("viewBox", "0 0 200 200");
        // svg.setAttribute("width", "200");
        // svg.setAttribute("height", "200");

        const clock = document.createElementNS(svgNS, "circle");
        clock.setAttribute("cx", "100");
        clock.setAttribute("cy", "100");
        clock.setAttribute("r", "80");
        clock.setAttribute("fill", "none");
        clock.setAttribute("stroke", "black");
        svg.appendChild(clock);

        const createPiePart = (startAngle: number, endAngle: number): SVGPathElement => {
            const path = document.createElementNS(svgNS, "path");
            const startX = 100 + Math.cos((startAngle - 90) * Math.PI / 180) * 80; // Calculate start point on circle
            const startY = 100 + Math.sin((startAngle - 90) * Math.PI / 180) * 80;
            const endX = 100 + Math.cos((endAngle - 90) * Math.PI / 180) * 80; // Calculate end point on circle
            const endY = 100 + Math.sin((endAngle - 90) * Math.PI / 180) * 80;
            const largeArcFlag = (endAngle - startAngle) > 180 ? 1 : 0; // Use large arc for angles > 180 degrees
            const pathData = `M 100,100 L ${startX},${startY} A 80,80 0 ${largeArcFlag},1 ${endX},${endY} Z`;
            path.setAttribute("d", pathData);
            path.setAttribute('stroke', 'black');

            return path;
        }

        let previousTracking: ChartTrackingData | null = null;
        data.trackings.forEach((tracking, index) => {
            const startAngle = timeToAngle(tracking.start);
            const endAngle = timeToAngle(tracking.end);

            const part_next = createPiePart(startAngle, endAngle);
            svg.appendChild(part_next);
            // Alternate colors for segments
            part_next.setAttribute("fill", index % 2 === 0 ? "#8888AA" : "#0000AA");
            part_next.dataset.trackingId = tracking.id;
            part_next.classList.add("tracking");
            // on hover show task name
            part_next.addEventListener("click", () => {
                this.on_click(tracking);
            });

            if (!!previousTracking) {
                if (previousTracking.end > tracking.start) {
                    const previousAngle = timeToAngle(previousTracking.end);
                    const part_overlap = createPiePart(startAngle, previousAngle);
                    const previousTrackingData = previousTracking;
                    part_overlap.setAttribute("fill", "red");
                    part_overlap.classList.add("overlap");
                    part_overlap.addEventListener("click", () => {
                        this.on_click_overlap(
                            previousTrackingData,
                            tracking,
                        );
                    });
                    svg.appendChild(part_overlap);
                }
            }

            previousTracking = tracking;
        });
        return this.$svg;
    }
}

