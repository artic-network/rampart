
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
 * ------------------------------------------------------------------------
 * This file contains functions which modify parts of an already set config
 * ------------------------------------------------------------------------
 */

const { verbose } = require("../utils");
const { newReferenceColour, newSampleColour } = require("../colours");
const { UNMAPPED_LABEL } = require("../magics");

/**
 * This file contains functions which modify parts of an already set config
 */

/**
 * A reducer to update the global config object via client provided data.
 * The `action` here doesn't (necessarily) have a `type`, we instead interogate
 * the properties of the action make (potentially multiple) modifications to the
 * config object.
 * @param {Object} clientSettings new config paramaters sent from the client
 * @returns {undefined}
 * @sideEffect (1) modifies global.config in place
 *             (2) notifies client of updated config
 *             (3) [potentially] triggers data updates & notifies client of updated data
 */
const modifyConfig = (action) => {
  verbose("config", `Modifying the following parts of the config: ${Object.keys(action).join(", ")}`);

  let dataHasChanged = false;

  if (action.hasOwnProperty("logYAxis")) {
      global.config.display.logYAxis = action.logYAxis;
  }

  if (action.hasOwnProperty("relativeReferenceMapping")) {
      global.config.display.relativeReferenceMapping = action.relativeReferenceMapping;
  }

  /* until ~march 2020 we stored all these reads, which allowed us to use filtering,
  and remapping of barcodes -> samples. This caused a memory footprint which wasn't
  acceptable, and so we're temporarily removing it, and any UI which relies on it */
  // if (action.hasOwnProperty("filters")) {
  //     global.config.display.filters = action.filters; // TODO: check for equality?
  //     global.datastore.changeReadFilters();
  //     dataHasChanged = true;
  // }

  // if (action.hasOwnProperty("barcodeToSamples")) {
  //     modifySamplesAndBarcodes(global.config, action.barcodeToSamples);
  //     global.config.run.samples.forEach((s, i) => {
  //         if (!s.colour) {
  //             s.colour = newSampleColour(s.name);
  //         }
  //     })
  //     global.datastore.recalcSampleData();
  //     dataHasChanged = true;
  // }

  global.CONFIG_UPDATED();
  if (dataHasChanged) global.NOTIFY_CLIENT_DATA_UPDATED();
};



/**Modify the config to reflect new data.
 * `newBarcodesToSamples` has format [[bc, name], ...]
 * TODO: preserve ordering where possible -- e.g. a name swap for 1 barcode shouln't change order
 */
function modifySamplesAndBarcodes(config, newBarcodesToSamples) {

  /* step 1: remove already-set barcodes which match those on cmd line */
  const newBarcodes = newBarcodesToSamples.map((d) => d[0]);
  config.run.samples.forEach((sample) => {
      sample.barcodes = sample.barcodes.filter((b) => !newBarcodes.includes(b))
  })

  /* step 2: add in barcodes to existing samples or create new samples as needed */
  newBarcodesToSamples.forEach(([newBarcode, newSampleName]) => {
      let added = false
      config.run.samples.forEach((sample) => {
          if (sample.name === newSampleName) {
              sample.barcodes.push(newBarcode);
              added = true;
          }
      })
      if (!added) {
          config.run.samples.push({name: newSampleName, description: "", barcodes: [newBarcode]})
      }
  });

  /* step 3: remove samples without any barcodes */
  config.run.samples = config.run.samples.filter((s) => !!s.barcodes.length);
}


/**
 * RAMPART doesn't know what references are out there, we can only add them as we see them
 * This updates the config store of the references, and triggers a client update if there are changes
 * @param {set} referencesSeen
 * @returns {bool} has the config changed?
 */
const updateReferencesSeen = (referencesSeen) => {
  const changes = [];
  const referencesInConfig = new Set([...global.config.genome.referencePanel.map((x) => x.name)]);
  referencesSeen.forEach((ref) => {
      if (ref !== UNMAPPED_LABEL && !referencesInConfig.has(ref)) {
          global.config.genome.referencePanel.push({
              name: ref,
              description: "to do",
              colour: newReferenceColour(ref),
              display: false
          });
          changes.push(ref);
      }
  });

  if (changes.length) {
      verbose("config", `new references seen: ${changes.join(", ")}`);
      return true;
  }
  return false;
};

const updateWhichReferencesAreDisplayed = (refsToDisplay) => {
  let changed = false;
  for (const refInfo of Object.values(global.config.genome.referencePanel)) {
      if (refInfo.display && !refsToDisplay.includes(refInfo.name)) {
          changed = true;
          refInfo.display = false;
      }
      if (!refInfo.display && refsToDisplay.includes(refInfo.name)) {
          changed = true;
          refInfo.display = true;
      }
  }
  if (changed) {
      verbose("config", `updated which refs in the reference panel should be displayed`);
      global.CONFIG_UPDATED();
  }
};

module.exports = {
  modifySamplesAndBarcodes,
  modifyConfig,
  updateReferencesSeen,
  updateWhichReferencesAreDisplayed
}