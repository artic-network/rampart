/*
 * Copyright (c) 2019 ARTIC Network http://artic.network
 * https://github.com/artic-network/rampart
 *
 * This file is part of RAMPART. RAMPART is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version. RAMPART is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See the GNU General Public License for more details. You should have received a copy of the GNU General Public License
 * along with RAMPART. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import React from 'react';


const Toggle = ({labelLeft, labelRight, toggleOn, handleToggle}) => (
  <div className="toggle">

    <span>
      {labelLeft}
    </span>

    <label>
        <span className="background"/>
        <input type="checkbox" onClick={handleToggle} value={toggleOn}/>
        <span className={`slider round`}/>
    </label>

    <span>
      {labelRight}
    </span>

  </div>
)

export default Toggle;