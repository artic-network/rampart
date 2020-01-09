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

/** A React Component which renders a list of barcode names -> sample Names where the
 * sample names are modifiable text boxes.
 * TODO:  add ordering box / dragger here
 */ 
const BarcodeNames = ({barcodeNames, setBarcodeNames}) => {
    return (
        <>
            <h2>Barcodes</h2>
            {Object.keys(barcodeNames)
                .sort((a, b) => barcodeNames[a].order > barcodeNames[b].order ? 1 : -1)
                .map((barcodeName) => {
                    return (
                        <label key={barcodeName}>
                            <div className={"bcLabel"}>
                                {`${barcodeName}`}
                            </div>
                            <input
                                type="text"
                                value={barcodeNames[barcodeName].name}
                                onChange={(event) => {
                                    const newState = {...barcodeNames};
                                    newState[barcodeName].name = event.target.value;
                                    setBarcodeNames(newState)
                                }}
                            />
                        </label>
                    );
                })
            }
        </>
    )
}

export default BarcodeNames;
