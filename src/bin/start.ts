#!/usr/bin/env node
'use strict';

import Vestaboard2MQTT from '../lib/index.js';

Vestaboard2MQTT.run().catch(error => {
    console.log(error);
    process.exit(1);
});
