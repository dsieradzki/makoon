import "primereact/resources/themes/arya-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import './App.css';
import "./assets/fonts/fonts.css";
import Router from "@/Router";
import ErrorPanel from "@/components/ErrorPanel/ErrorPanel";


function App() {
    return <>
        <ErrorPanel/>
        <Router/>
    </>
}

export default App
