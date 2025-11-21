import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import '../App.css'; 


export interface IPoint { x: number; y: number; }
export class Point implements IPoint { constructor(public x: number, public y: number) {} }
export interface IBoundary { cx: number; cy: number; hx: number; hy: number; }

export class AABB implements IBoundary {
    constructor(public cx: number, public cy: number, public hx: number, public hy: number) {}
    contains(point: IPoint): boolean {
        return (
            point.x >= this.cx - this.hx && point.x <= this.cx + this.hx &&
            point.y >= this.cy - this.hy && point.y <= this.cy + this.hy
        );
    }
    getBounds(): [number, number, number, number] {
        return [this.cx - this.hx, this.cy - this.hy, this.cx + this.hx, this.cy + this.hy];
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
        this.NE = this.NW = this.SE = this.SW = null;
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
        if (!this.boundary.contains(point)) return false;
        
        if (!this.divided) {
            if (this.points.length < this.capacity) {
                this.points.push(point);
                return true;
            }
            this.subdivide();
            
            return (this.NE!.insert(point) || this.NW!.insert(point) || this.SE!.insert(point) || this.SW!.insert(point));
        }

        return (this.NE!.insert(point) || this.NW!.insert(point) || this.SE!.insert(point) || this.SW!.insert(point));
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
        if (!this.divided) return this.depth;
        return Math.max(
            this.NE?.getMaxDepth() || this.depth,
            this.NW?.getMaxDepth() || this.depth,
            this.SE?.getMaxDepth() || this.depth,
            this.SW?.getMaxDepth() || this.depth
        );
    }
}
// **********************************************
// ********* FIN DE LÓGICA DEL QUADTREE *********
// **********************************************


const CANVAS_SIZE = 400;
const BOUNDARY_MAX = CANVAS_SIZE / 2; // 200

const QuadtreeDemo: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capacity, setCapacity] = useState<number>(4);
    const [points, setPoints] = useState<IPoint[]>([]);
    const [newPointX, setNewPointX] = useState<string>('');
    const [newPointY, setNewPointY] = useState<string>('');
    const [maxDepth, setMaxDepth] = useState<number>(0);
    const [nodesCount, setNodesCount] = useState<number>(1);

    // Función para mapear X: -200 -> 0; 0 -> 200; 200 -> 400
    const mapToCanvas = useCallback((coord: number): number => coord + BOUNDARY_MAX, []);

    const qt = useMemo(() => {
        try {
            const boundary = new AABB(0, 0, BOUNDARY_MAX, BOUNDARY_MAX);
            const quadtree = new Quadtree(boundary, capacity);
            for (const point of points) {
                quadtree.insert(point);
            }
            return quadtree;
        } catch (error) {
            console.error("Fallo crítico en la construcción del Quadtree:", error);
            const safe_boundary = new AABB(0, 0, BOUNDARY_MAX, BOUNDARY_MAX);
            return new Quadtree(safe_boundary, capacity);
        }
    }, [capacity, points]);

    useEffect(() => {
        if (qt) {
            setNodesCount(qt.getBoundsRecursive().length);
            setMaxDepth(qt.getMaxDepth());
        }
    }, [qt]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;

        const bounds = qt.getBoundsRecursive();
        for (const boundary of bounds) {
            const [minX, minY, maxX, maxY] = boundary.getBounds();
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            const canvasMinX = mapToCanvas(minX);
            

            const canvasTopY_Invertido = BOUNDARY_MAX - maxY;
            
            ctx.strokeRect(canvasMinX, canvasTopY_Invertido, width, height);
        }

        ctx.fillStyle = '#007bff';
        const allPoints = qt.getPointsRecursive();

        for (const point of allPoints) {
            const cx = mapToCanvas(point.x);
 
            const cy = BOUNDARY_MAX - point.y; 
            
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    }, [qt, mapToCanvas]);

    useEffect(() => {
        draw();
    }, [draw]);

    const handleAddPoint = () => {
        const x = parseFloat(newPointX);
        const y = parseFloat(newPointY);

        if (isNaN(x) || isNaN(y) || x < -BOUNDARY_MAX || x > BOUNDARY_MAX || y < -BOUNDARY_MAX || y > BOUNDARY_MAX) {
            alert("Ingrese coordenadas válidas entre -200 y 200.");
            return;
        }
        setPoints([...points, new Point(x, y)]);
        setNewPointX('');
        setNewPointY('');
    };

    const handleReset = () => {
        setPoints([]);
        setMaxDepth(0);
        setNodesCount(1);
    };

    const handleLoadExample = (type: 'cluster' | 'sparse') => {
        let examplePoints: IPoint[] = [];
        let cap: number;

        if (type === 'cluster') {
            cap = 3;
            examplePoints = [
                new Point(10, 10), new Point(15, 15), new Point(10, 20), new Point(18, 18), new Point(20, 10),
                new Point(-150, -150), 
                new Point(150, 150),   
                new Point(12, 12),
                new Point(5, 5),
            ];
        } else {
            cap = 5;
            examplePoints = [
                new Point(180, 180), new Point(-180, 180), new Point(-180, -180), new Point(180, -180),
                new Point(0, 0), new Point(50, 50), new Point(-50, 50), new Point(0, 100), new Point(100, 0)
            ];
        }
        setCapacity(cap); 
        setPoints(examplePoints);
    };

    return (
        <div className="quadtree-content-wrapper">
            <div className="theory-section">
                <h2>Fundamento del Quadtree (Point-Region)</h2>
                <p>El Quadtree es una estructura de datos jerárquica que divide recursivamente un espacio bidimensional en cuatro cuadrantes (NE, NW, SE, SW). Utilizamos el **PR Quadtree**, donde la subdivisión se activa si la región contiene más puntos que la **Capacidad Máxima (C)**.</p>
                
                <h3 className="subsection">Algoritmo de Inserción</h3>
                <pre className="code-block">
{`bool insert(Point p) {
    if (boundary.contains(p) && points.size() < capacity) {
        // 1. Insertar si hay espacio
        points.push_back(p);
        return true;
    }
    // 2. Si se excede la capacidad, subdividir y redistribuir
    if (!divided) {
        subdivide();
    }
    // 3. Pasar la inserción al hijo correcto
    return (NE->insert(p) || NW->insert(p) || SE->insert(p) || SW->insert(p));
}
`}
                </pre>
            </div>
            
            <div className="quadtree-demo">
                <h2>Demostración Interactiva</h2>
                <p className="demo-description">Observe cómo el Quadtree adapta su estructura a la densidad de los datos. Coordenadas: X, Y entre -200 y 200.</p>

                <div className="demo-content-wrapper">
                    <div className="visualization">
                        <h3>Visualización</h3>
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            className="quadtree-canvas"
                        />
                        <p className="hint">El Quadtree se adapta. Las regiones con alta densidad se subdividen más.</p>
                    </div>

                    <div className="controls">
                        <h3>Configuración</h3>
                        <div className="input-group">
                            <label>Capacidad Máxima (C): </label>
                            <input
                                type="number"
                                value={capacity}
                                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                                min="1"
                                className="input-short"
                            />
                            <p className="hint">Si una región contiene más de C puntos, se divide.</p>
                        </div>
                        
                        <h3>Añadir Punto (Ejemplo del Usuario)</h3>
                        <div className="input-row">
                            <input
                                type="number"
                                placeholder="X"
                                value={newPointX}
                                onChange={(e) => setNewPointX(e.target.value)}
                                className="input-coord"
                            />
                            <input
                                type="number"
                                placeholder="Y"
                                value={newPointY}
                                onChange={(e) => setNewPointY(e.target.value)}
                                className="input-coord"
                            />
                            <button onClick={handleAddPoint} disabled={!newPointX || !newPointY}>
                                Insertar
                            </button>
                        </div>
                        
                        <div className="button-row">
                            <button onClick={handleReset} className="btn-secondary">
                                Reiniciar Todo
                            </button>
                        </div>

                        <h3>Ejemplos de Distribución</h3>
                        <div className="button-row">
                            <button onClick={() => handleLoadExample('cluster')} className="btn-primary" style={{marginRight: '10px'}}>
                                1. Carga de Cluster (C=3)
                            </button>
                            <button onClick={() => handleLoadExample('sparse')} className="btn-primary">
                                2. Distribución Dispersa (C=5)
                            </button>
                            <p className="hint" style={{marginTop: '10px'}}>El clustering fuerza alta profundidad, la dispersa usa menos nodos.</p>
                        </div>


                        <div className="stats">
                            <h3>Estadísticas</h3>
                            <p>Puntos Insertados (n): <strong>{points.length}</strong></p>
                            <p>Profundidad Máxima (h): <strong>{maxDepth}</strong></p>
                            <p>Nodos Generados: <strong>{nodesCount}</strong></p>
                        </div>
                        
                        <h3>Lista de Puntos</h3>
                        <div className="point-list">
                            {points.map((p, index) => (
                                <div key={index}>({p.x.toFixed(1)}, {p.y.toFixed(1)})</div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default QuadtreeDemo;