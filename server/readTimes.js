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

/**
 * median read time from an annotated CSV
 * @param {Array} annotations
 * @returns unix timestamp in ms
 */
const getTimeFromAnnotatedCSV = (annotations) => {
    return (annotations
        .map((a) => (new Date(a.start_time)).getTime())
        .sort((a, b) => a - b) // numerical sort
    )[Math.floor(annotations.length/2)];
}

module.exports = {
  getTimeFromAnnotatedCSV
}
