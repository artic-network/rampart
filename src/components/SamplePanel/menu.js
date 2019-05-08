import React from 'react';
import ReactDOM from 'react-dom';
import { ContextMenu, MenuItem } from "react-contextmenu";

/**
 * @param {str} param0.id - the id attached to the <ContextMenuTrigger> el
 * @param {array of obj} param0.items - list of {label: "str", callback: func} 
 */
const Menu = ({id, items}) => {
  return (
    ReactDOM.createPortal(
      (
        <div>
          <ContextMenu id={id} hideOnLeave={true}>
            {items.map((item) => (
              <MenuItem onClick={item.callback} key={item.label}>
                {item.label}
              </MenuItem>
            ))}
          </ContextMenu>
        </div>
      ),
      document.querySelector(`#contextMenuPortal`)
    )
  )
};

export default Menu;
