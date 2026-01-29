import chalk from 'chalk';

class Logger {
  static success(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${chalk.green('SUCCESS')}] : ${message}`;
    console.log(`${chalk.gray(timestamp)} ${logMessage}`);
    if (data) {
      console.log(chalk.cyan('Data:'), data);
    }
  }

  static error(message, error = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${chalk.red('FAILED')}] : ${message}`;
    console.error(`${chalk.gray(timestamp)} ${logMessage}`);
    if (error) {
      console.error(chalk.red('Error:'), error.message || error);
    }
  }

  static info(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${chalk.blue('INFO')}] : ${message}`;
    console.log(`${chalk.gray(timestamp)} ${logMessage}`);
    if (data) {
      console.log(chalk.cyan('Data:'), data);
    }
  }

  static warning(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${chalk.yellow('WARNING')}] : ${message}`;
    console.log(`${chalk.gray(timestamp)} ${logMessage}`);
    if (data) {
      console.log(chalk.cyan('Data:'), data);
    }
  }

  static connection(service, status, details = null) {
    const timestamp = new Date().toLocaleTimeString();
    const statusText = status ? chalk.green('Connected') : chalk.red('Failed');
    const logMessage = `[${status ? chalk.green('SUCCESS') : chalk.red('FAILED')}] : ${service} Connection`;
    console.log(`${chalk.gray(timestamp)} ${logMessage}`);
    if (details) {
      console.log(chalk.cyan('Details:'), details);
    }
  }

  static route(method, path, status, responseTime = null) {
    const timestamp = new Date().toLocaleTimeString();
    const statusText = status >= 200 && status < 300 ? chalk.green(status) : chalk.red(status);
    const methodColored = this.colorMethod(method);
    const logMessage = `${methodColored} ${path} ${statusText}`;
    if (responseTime) {
      console.log(`${chalk.gray(timestamp)} [${chalk.blue('ROUTE')}] : ${logMessage} - ${chalk.yellow(responseTime + 'ms')}`);
    } else {
      console.log(`${chalk.gray(timestamp)} [${chalk.blue('ROUTE')}] : ${logMessage}`);
    }
  }

  static socket(event, status, details = null) {
    const timestamp = new Date().toLocaleTimeString();
    const statusText = status ? chalk.green('Success') : chalk.red('Failed');
    const logMessage = `[${status ? chalk.green('SOCKET') : chalk.red('SOCKET')}] : ${event} - ${statusText}`;
    console.log(`${chalk.gray(timestamp)} ${logMessage}`);
    if (details) {
      console.log(chalk.cyan('Details:'), details);
    }
  }

  static colorMethod(method) {
    const colors = {
      GET: chalk.green,
      POST: chalk.blue,
      PUT: chalk.yellow,
      DELETE: chalk.red,
      PATCH: chalk.magenta
    };
    return colors[method] ? colors[method](method) : chalk.white(method);
  }

  static server(port) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${chalk.gray(timestamp)} [${chalk.green('SERVER')}] : 🚀 Server running on port ${chalk.yellow(port)}`);
  }

  static middleware(name) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${chalk.gray(timestamp)} [${chalk.cyan('MIDDLEWARE')}] : ${name} initialized`);
  }
}

export default Logger;
