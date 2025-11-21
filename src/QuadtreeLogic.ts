
export interface IPoint {
    x: number;
    y: number;
}

export class Point implements IPoint {
    constructor(public x: number, public y: number) {}
}

export interface IBoundary {
    cx: number;
    cy: number;
    hx: number;
    hy: number;
}

export class AABB implements IBoundary {
    constructor(public cx: number, public cy: number, public hx: number, public hy: number) {}

    contains(point: IPoint): boolean {
        return (
            point.x >= this.cx - this.hx &&
            point.x <= this.cx + this.hx &&
            point.y >= this.cy - this.hy &&
            point.y <= this.cy + this.hy
        );
    }

    getBounds(): [number, number, number, number] {
        return [
            this.cx - this.hx, 
            this.cy - this.hy, 
            this.cx + this.hx, 
            this.cy + this.hy 
        ];
    }
}

export class Quadtree {
    public boundary: AABB;
    public capacity: number;
    public points: IPoint[];
    public divided: boolean;
    public depth: number;
    
    public NE: Quadtree | null;
    public NW: Quadtree | null;
    public SE: Quadtree | null;
    public SW: Quadtree | null;

    constructor(boundary: AABB, capacity: number, depth: number = 0) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
        this.depth = depth;
        this.NE = null;
        this.NW = null;
        this.SE = null;
        this.SW = null;
    }

    private subdivide(): void {
        const x = this.boundary.cx;
        const y = this.boundary.cy;
        const hx = this.boundary.hx / 2;
        const hy = this.boundary.hy / 2;
        const C = this.capacity;
        const newDepth = this.depth + 1;

        this.NE = new Quadtree(new AABB(x + hx, y - hy, hx, hy), C, newDepth);
        this.NW = new Quadtree(new AABB(x - hx, y - hy, hx, hy), C, newDepth);
        this.SE = new Quadtree(new AABB(x + hx, y + hy, hx, hy), C, newDepth);
        this.SW = new Quadtree(new AABB(x - hx, y + hy, hx, hy), C, newDepth);

        this.divided = true;

        for (const point of this.points) {
            this.NE!.insert(point);
            this.NW!.insert(point);
            this.SE!.insert(point);
            this.SW!.insert(point);
        }
        this.points = [];
    }

    insert(point: IPoint): boolean {
        if (!this.boundary.contains(point)) {
            return false;
        }

        if (!this.divided) {
            if (this.points.length < this.capacity) {
                this.points.push(point);
                return true;
            }

            this.subdivide();
            
            return (
                this.NE!.insert(point) ||
                this.NW!.insert(point) ||
                this.SE!.insert(point) ||
                this.SW!.insert(point)
            );
        }

        return (
            this.NE!.insert(point) ||
            this.NW!.insert(point) ||
            this.SE!.insert(point) ||
            this.SW!.insert(point)
        );
    }

    getBoundsRecursive(boundsList: AABB[] = []): AABB[] {
        boundsList.push(this.boundary);

        if (this.divided) {
            if (this.NE) this.NE.getBoundsRecursive(boundsList);
            if (this.NW) this.NW.getBoundsRecursive(boundsList);
            if (this.SE) this.SE.getBoundsRecursive(boundsList);
            if (this.SW) this.SW.getBoundsRecursive(boundsList);
        }
        return boundsList;
    }
    
    getPointsRecursive(pointsList: IPoint[] = []): IPoint[] {
        pointsList.push(...this.points);

        if (this.divided) {
            if (this.NE) this.NE.getPointsRecursive(pointsList);
            if (this.NW) this.NW.getPointsRecursive(pointsList);
            if (this.SE) this.SE.getPointsRecursive(pointsList);
            if (this.SW) this.SW.getPointsRecursive(pointsList);
        }
        return pointsList;
    }

    getMaxDepth(): number {
        if (!this.divided) {
            return this.depth;
        }
        return Math.max(
            this.NE?.getMaxDepth() || this.depth,
            this.NW?.getMaxDepth() || this.depth,
            this.SE?.getMaxDepth() || this.depth,
            this.SW?.getMaxDepth() || this.depth
        );
    }
}