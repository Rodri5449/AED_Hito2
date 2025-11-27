#include <iostream>
#include <vector>
using namespace std;

struct Point {
    double x, y;
    Point(double _x, double _y) : x(_x), y(_y) {}
};

struct Rect {
    double x, y;
    double w, h;

    Rect(double _x, double _y, double _w, double _h)
        : x(_x), y(_y), w(_w), h(_h) {}

    bool contains(const Point& p) const {
        return (p.x >= x - w && p.x <= x + w &&
                p.y >= y - h && p.y <= y + h);
    }
};

class Quadtree {
private:
    static const int CAPACIDAD = 4;

    Rect boundary;
    vector<Point> puntos;

    bool dividido;
    Quadtree *noroeste;
    Quadtree *noreste;
    Quadtree *suroeste;
    Quadtree *sureste;

public:
    Quadtree(const Rect& region)
        : boundary(region), dividido(false),
          noroeste(nullptr), noreste(nullptr),
          suroeste(nullptr), sureste(nullptr) {}

    void subdividir() {
        double x = boundary.x;
        double y = boundary.y;
        double w = boundary.w / 2;
        double h = boundary.h / 2;

        noroeste = new Quadtree(Rect(x - w, y + h, w, h));
        noreste  = new Quadtree(Rect(x + w, y + h, w, h));
        suroeste = new Quadtree(Rect(x - w, y - h, w, h));
        sureste  = new Quadtree(Rect(x + w, y - h, w, h));

        dividido = true;
    }

    bool insertar(const Point& p) {
        if (!boundary.contains(p))
            return false;

        if (puntos.size() < CAPACIDAD) {
            puntos.push_back(p);
            return true;
        }

        if (!dividido)
            subdividir();

        if (noroeste->insertar(p)) return true;
        if (noreste->insertar(p))  return true;
        if (suroeste->insertar(p)) return true;
        if (sureste->insertar(p))  return true;

        return false;
    }

    void imprimir(int nivel = 0) const {
        for (int i = 0; i < nivel; i++) cout << "  ";
        cout << "Nodo (" << boundary.x << ", " << boundary.y
             << ") w=" << boundary.w << " h=" << boundary.h
             << " -> puntos: " << puntos.size() << endl;

        if (dividido) {
            noroeste->imprimir(nivel + 1);
            noreste->imprimir(nivel + 1);
            suroeste->imprimir(nivel + 1);
            sureste->imprimir(nivel + 1);
        }
    }
};

int main() {
    Rect area(0, 0, 8, 8);
    Quadtree qt(area);

    qt.insertar(Point(1, 1));
    qt.insertar(Point(2, 5));
    qt.insertar(Point(-4, 3));
    qt.insertar(Point(6, -2));
    qt.insertar(Point(3, 3));
    qt.insertar(Point(7, 6));

    qt.imprimir();
    return 0;
}
