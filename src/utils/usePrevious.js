/* taken from the official react docs
https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state */

import {useRef, useEffect} from "react";

function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

export default usePrevious;