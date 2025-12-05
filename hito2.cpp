#include <iostream>
#include <vector>
using namespace std;

struct Point
{
    double x, y;
    Point(double _x, double _y) : x(_x), y(_y) {}
};

struct Rect
{
    double x, y;
    double w, h;

    Rect(double _x, double _y, double _w, double _h)
        : x(_x), y(_y), w(_w), h(_h) {}

    bool contains(const Point &p) const
    {
        return (p.x >= x - w && p.x <= x + w &&
                p.y >= y - h && p.y <= y + h);
    }

    bool intersects(const Rect &other) const
    {
        return !(other.x - other.w > x + w ||
                 other.x + other.w < x - w ||
                 other.y - other.h > y + h ||
                 other.y + other.h < y - h);
    }
};

class Quadtree
{
private:
    static const int CAPACIDAD = 4;

    Rect boundary;
    vector<Point> puntos;

    bool dividido;
    Quadtree *noroeste, *noreste, *suroeste, *sureste;

public:
    Quadtree(const Rect &region)
        : boundary(region), dividido(false),
          noroeste(nullptr), noreste(nullptr),
          suroeste(nullptr), sureste(nullptr) {}

    void subdividir()
    {
        double x = boundary.x;
        double y = boundary.y;
        double w = boundary.w / 2;
        double h = boundary.h / 2;

        noroeste = new Quadtree(Rect(x - w, y + h, w, h));
        noreste = new Quadtree(Rect(x + w, y + h, w, h));
        suroeste = new Quadtree(Rect(x - w, y - h, w, h));
        sureste = new Quadtree(Rect(x + w, y - h, w, h));

        dividido = true;

        for (const Point &p : puntos)
        {
            if (noroeste->insertar(p))
                continue;
            if (noreste->insertar(p))
                continue;
            if (suroeste->insertar(p))
                continue;
            if (sureste->insertar(p))
                continue;
        }

        puntos.clear();
    }

    bool insertar(const Point &p)
    {
        if (!boundary.contains(p))
            return false;

        if (!dividido)
        {
            if (puntos.size() < CAPACIDAD)
            {
                puntos.push_back(p);
                return true;
            }
            subdividir();
        }

        if (noroeste->insertar(p))
            return true;
        if (noreste->insertar(p))
            return true;
        if (suroeste->insertar(p))
            return true;
        if (sureste->insertar(p))
            return true;

        return false;
    }

    bool eliminar(const Point &p)
    {
        if (!boundary.contains(p))
            return false;

        if (!dividido)
        {
            for (auto erase = puntos.begin(); erase != puntos.end(); ++erase)
            {
                if (erase->x == p.x && erase->y == p.y)
                {
                    puntos.erase(erase);
                    return true;
                }
            }
            return false;
        }

        bool eliminado = false;

        if (noroeste->eliminar(p))
            eliminado = true;
        else if (noreste->eliminar(p))
            eliminado = true;
        else if (suroeste->eliminar(p))
            eliminado = true;
        else if (sureste->eliminar(p))
            eliminado = true;

        if (!eliminado)
            return false;

        if (!noroeste->dividido && !noreste->dividido &&
            !suroeste->dividido && !sureste->dividido)
        {
            int total =
                noroeste->puntos.size() +
                noreste->puntos.size() +
                suroeste->puntos.size() +
                sureste->puntos.size();

            if (total <= CAPACIDAD)
            {

                puntos.reserve(total);
                puntos.insert(puntos.end(),
                              noroeste->puntos.begin(), noroeste->puntos.end());
                puntos.insert(puntos.end(),
                              noreste->puntos.begin(), noreste->puntos.end());
                puntos.insert(puntos.end(),
                              suroeste->puntos.begin(), suroeste->puntos.end());
                puntos.insert(puntos.end(),
                              sureste->puntos.begin(), sureste->puntos.end());

                delete noroeste;
                delete noreste;
                delete suroeste;
                delete sureste;

                noroeste = noreste = suroeste = sureste = nullptr;
                dividido = false;
            }
        }

        return true;
    }

    void buscarEnRango(const Rect &range, vector<Point> &encontrados) const
    {

        if (!boundary.intersects(range))
            return;

        for (const Point &p : puntos)
        {
            if (range.contains(p))
            {
                encontrados.push_back(p);
            }
        }

        if (dividido)
        {
            noroeste->buscarEnRango(range, encontrados);
            noreste->buscarEnRango(range, encontrados);
            suroeste->buscarEnRango(range, encontrados);
            sureste->buscarEnRango(range, encontrados);
        }
    }

    void imprimir(int nivel = 0) const
    {
        string indent(nivel * 2, ' ');

        cout << indent << "Nodo centro=(" << boundary.x
             << ", " << boundary.y << ") w="
             << boundary.w << " h=" << boundary.h
             << " | puntos=" << puntos.size() << endl;

        for (const auto &p : puntos)
            cout << indent << " (" << p.x << ", " << p.y << ")\n";

        if (dividido)
        {
            cout << indent << "  [Noroeste]\n";
            noroeste->imprimir(nivel + 2);

            cout << indent << "  [Noreste]\n";
            noreste->imprimir(nivel + 2);

            cout << indent << "  [Suroeste]\n";
            suroeste->imprimir(nivel + 2);

            cout << indent << "  [Sureste]\n";
            sureste->imprimir(nivel + 2);
        }
    }
};

int main()
{
    Rect area(0, 0, 8, 8);
    Quadtree qt(area);

    qt.insertar(Point(1, 1));
    qt.insertar(Point(2, 5));
    qt.insertar(Point(-4, 3));
    qt.insertar(Point(6, -2));
    qt.insertar(Point(3, 3));
    qt.insertar(Point(7, 6));
    qt.insertar(Point(2, 3));
    qt.insertar(Point(-2, -3));

    qt.imprimir();

    cout << "\n=== Eliminando (3, 3) y (7,6) ===\n";
    qt.eliminar(Point(3, 3));
    qt.eliminar(Point(7, 6));
    qt.imprimir();

    Rect areaConsulta(0, 0, 1, 1);
    vector<Point> resultados;

    qt.buscarEnRango(areaConsulta, resultados);

    cout << "\nPuntos encontrados:\n";
    for (auto &p : resultados)
        cout << "(" << p.x << ", " << p.y << ")\n";

    return 0;
}