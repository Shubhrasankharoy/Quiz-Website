import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const usePreventReload = (setAlert_message, setShow_alert, isAttempting) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAttempting) return;

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = ""; // Triggers the browser warning
            setAlert_message("You have an ongoing quiz. Leaving will submit it automatically.");
            setShow_alert(true);
            return "";
        };

        const handlePopState = (event) => {
            window.history.pushState(null, "", window.location.href);
            setAlert_message("You cannot go back during the quiz.");
            setShow_alert(true);
        };

        const handleNavigation = (event) => {
            event.preventDefault();
            setAlert_message("You have an ongoing quiz. Do you want to submit it before leaving?");
            setShow_alert(true);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handlePopState);
        window.addEventListener("click", handleNavigation, true);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("click", handleNavigation, true);
        };
    }, [isAttempting, setAlert_message, setShow_alert]);
};

export default usePreventReload;
