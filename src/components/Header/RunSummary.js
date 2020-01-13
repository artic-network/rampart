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
import {makeTimeFormatter} from "../../utils/commonFunctions";

const timeFormatter = makeTimeFormatter();

const RunSummary = ({combinedData, timeSinceLastDataUpdate}) => {
  const readsMsg = combinedData ? `${combinedData.mappedCount} reads mapped | ${combinedData.processedCount} processed ` : "no data yet ";
  const rateMsg = combinedData && combinedData.processedRate >= 0 ?
      `${Math.round(combinedData.processedRate)} reads/sec` : "calculating rate...";
  const lastSeenMsg = timeSinceLastDataUpdate < 5 ?
    "" :
    `| Data last received ${timeFormatter(timeSinceLastDataUpdate)} ago`;
    return <h3>{`${readsMsg} | ${rateMsg} ${lastSeenMsg}`}</h3>
  };

export default RunSummary;