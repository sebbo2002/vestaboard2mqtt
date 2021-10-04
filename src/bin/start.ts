#!/usr/bin/env node
'use strict';

import Vestaboard2MQTT from '../lib';

Vestaboard2MQTT.run().catch(error => {
    console.log(error);
    process.exit(1);
});
