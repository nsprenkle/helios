# helios

Project **Helios** is a design and development project to simplify and open-source off-grid solar power systems.

##Hardware

A solar panel and charge controller were used in conjunction to charge a deep-cycle lead-acid battery. Special sensor hardware connected to an Arduino Yun allowed for collection of charge data and communication of that data to a web server.

##Software
The Arduino Yun created a CSV file and sent data updates once per minute to a web server. Visitors to the web frontend are able to see D3.js powered data visualizations of the charge data crafted from the CSV file.
