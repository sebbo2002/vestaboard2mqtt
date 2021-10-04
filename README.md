# vestaboard2mqtt

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

Small script to connect a Vestaboard with my home automation via MQTT.
Can display messages, the current day or a calendar.


## 📦 Installation

	npm install -g @sebbo2002/vestaboard2mqtt

Configuration is expected in the file "~/.vestaboard2mqtt". An example file is in the root folder.
Please stop the script before editing.


## 📑 Pages

### Simple Message

Displays a message on the board. To do this, send the content of the message to `:prefix/message`.

### Today

Displays today's day of the week and the date. Can optionally be extended with the temperature and
the probability of rain.

Activated with a message to `:prefix/today`. The weather data can either be sent as JSON
(`{"temp": [16, 28], "precip": 5}`) or set individually (e.g. `:prefix/today/min-temp` or
`:prefix/today/precip`).

### Calendar

Displays the next entries for one or more selected calendars. Calendars are set in the file
beforehand. The calendar is activated with `:prefix/calendar`, specifying the list of
calendars to be viewed, comma-separated.

If there are no entries for the current day, the display of Today (see above) is output.


## 🙆🏼‍♂️ Copyright and license

Copyright (c) Sebastian Pekarek under the [MIT license](LICENSE).
