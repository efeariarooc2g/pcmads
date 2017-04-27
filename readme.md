######NPDC interface for Profitability and Cost Management

To run cd into the app directory

`cd NPDC/pcmads` and run

`SET DEBUG=pcmads:* & npm start`

 to auto restart web server when file changes
 `npm install -g nodemon` and start server using
  `nodemon SET DEBUG=pcmads:* & npm start`

   Install `IISNODE` and Configure iisnode to pass the special variable `LOGON_USER` from IIS to node

    `<configuration>
      <system.webServer>
        <!-- ... -->
        <iisnode promoteServerVars="LOGON_USER" />
      </system.webServer>
    </configuration>`
