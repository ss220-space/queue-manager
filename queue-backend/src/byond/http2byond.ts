import net from 'net'
import jspack from 'jspack'

// TODO: must be refactored

/**
 * Helper function, converts a string into a list representing each of it's characters by charCode
 * @param {string} str - The string to convert.\
 * @returns {Array} Array full of charcodes.
 */
const string2charcodes = (str) => {
  const retArray = [];
  for (let i = 0; i < str.length; i += 1) {
    retArray.push(str.charCodeAt(i));
  }
  return retArray;
};

export default function fetchByond(form): Promise<string> {
  // The timeout value to use for the socket. This is the minimum time that a request will take.
  const timeout = 2000;

  return new Promise((resolve, reject) => {
    let parameters = form.topic;
    if (parameters.charAt(0) !== '?') parameters = `'?${parameters}`;

    // Custom packet creation- BYOND expects special packets,
    // this is based off /tg/'s PHP scripts containing a reverse engineered packet format.
    let query = [0x00, 0x83];

    // Use an unsigned short for the "expected data length" portion of the packet.
    const pack = jspack.jspack.Pack('H', [parameters.length + 6]);
    query = query.concat(pack);

    // Padding between header and actual data.
    query = query.concat([0x00, 0x00, 0x00, 0x00, 0x00]);
    // Convert data into charcodes and add it to the array
    query = query.concat(string2charcodes(parameters));
    query.push(0x00);

    // Convert our new hex string into an actual buffer.
    const querybuff = Buffer.from(query);

    /* Networking section */
    /* Now that we have our data in a binary buffer, start sending and recieving data. */

    // Uses a normal net.Socket to send the custom packets.
    const socket = new net.Socket({
      readable: true,
      writable: true,
    });

    // Timeout handler. Removed upon successful connection.
    const tHandler = () => {
      reject(new Error('Connection failed.'));
      socket.destroy();
    };

    // Timeout after self.timeout (default 2) seconds of inactivity,
    // the game server is either extremely laggy or isn't up.
    socket.setTimeout(timeout);
    // Add the event handler.
    socket.on('timeout', tHandler);

    // Error handler. If an error happens in the socket API, it'll be given back to us here.
    const eHandler = (err) => {
      reject(err);
      socket.destroy();
    };

    // Add the error handler.
    socket.on('error', eHandler);

    // Establish the connection to the server.
    socket.connect({
      port: form.port,
      host: form.ip,
      family: 4, // Use IPv4.
    });

    socket.on('connect', () => {
      // Socket successfully opened to the server. Ready to send and recieve data.
      // The timeout handler will interfere later, as the game server never sends an END packet.
      // So, we just wait for it to time out to ensure we have all the data.
      socket.removeListener('timeout', tHandler);

      // Send the custom buffer data over the socket.
      socket.write(querybuff);

      // Function decodes the returned data once it's fully assembled.
      const decodeBuffer = (dbuff) => {
        if (!dbuff) {
          reject(new Error('No data recieved.'));
          return null;
        }

        // Confirm the return packet is in the BYOND format.
        if (dbuff[0] === 0x00 && dbuff[1] === 0x83) {
          // Start parsing the output.
          // Array size of the type identifier and content.
          const sizearray = [dbuff[2], dbuff[3]];
          // It's packed in an unsigned short format, so unpack it as an unsigned short.
          const sizebytes = jspack.jspack.Unpack('H', sizearray);
          // Byte size of the string/floating-point (minus the identifier byte).
          let size = sizebytes[0] - 1;

          if (dbuff[4] === 0x2a) {
            // 4-byte big-endian floating point data.
            const unpackarray = [dbuff[5], dbuff[6], dbuff[7], dbuff[8]];
            // 4 possible bytes, add them up and unpack as a big-endian (network) float
            const unpackint = jspack.jspack.Unpack('f', unpackarray);
            return unpackint[0];
          }

          if (dbuff[4] === 0x06) {
            // ASCII String.
            let unpackString = '';
            let index = 5; // Buffer index to start searching from.

            while (size > 0) {
              size -= 1;
              unpackString += String.fromCharCode(dbuff[index]);
              index += 1;
            }

            return unpackString;
          }
        }

        // Something went wrong, the packet contains no apparent data.
        // Error as "no data returned".
        reject(new Error('No data returned.'));
        return null;
      };

      // Recieve data in the form of a buffer.
      let assembledBuffer;
      socket.on('data', (rbuff) => {
        if (assembledBuffer) {
          assembledBuffer = Buffer.concat([assembledBuffer, rbuff]);
        } else {
          assembledBuffer = rbuff;
        }
      });

      // Since BYOND doesn't send END packets,
      // wait for timeout before trying to parse the returned data.
      socket.on('timeout', () => {
        // Decode the assembled data.
        const recievedData = decodeBuffer(assembledBuffer);
        // The catch will deal with any errors from decode_buffer,
        // but it could fail without erroring, so, make sure there's any data first.
        if (recievedData) {
          const regex = /\\u([\d\w]{4})/gi;
          const str = recievedData.replace(regex, (match, grp) => String.fromCharCode(parseInt(grp, 16))).slice(0, -1);

          resolve(str);
        }

        // Assume the socket is done sending data, and close the connection.
        socket.end();
      });
    });
  });
}
