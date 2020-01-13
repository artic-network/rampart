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
const BarcodeNames = ({barcodeToSamples, setBarcodeToSamples}) => {
    return (
        <>
            <h2>Barcodes</h2>
            {[...barcodeToSamples.entries()]
                .map((args) => {
                    const [barcode, name] = args;
                    return (
                        <label key={barcode}>
                            <div className={"bcLabel"}>
                                {`${barcode}`}
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(event) => {
                                    const newMap = new Map(barcodeToSamples);
                                    newMap.set(barcode, event.target.value);
                                    setBarcodeToSamples(newMap)
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
