import React from 'react';
import QuadtreeDemo from './components/QuadtreeDemo';
import './App.css';

const App: React.FC = () => {
    return (
        <div className="article-container">
            <header className="article-header">
                <h1 className="article-title">Quadtree: Algoritmo y Demostración Interactiva</h1>
                <p className="article-authors">
                    Explorando la indexación espacial jerárquica para aplicaciones modernas.
                </p>
            </header>

            <QuadtreeDemo />
        </div>
    );
};

export default App;