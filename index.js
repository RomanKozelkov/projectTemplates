const config = require('./config');
const vorpal = require('vorpal')();
const { lstatSync, readdirSync, copySync } = require('fs-extra');
const path = require('path');
const child_process = require('child_process');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source => readdirSync(path.resolve(__dirname, source)).map(name => path.join(source, name)).filter(isDirectory);
const templatesDir = path.resolve(__dirname, 'ground/templates');
let templatePaths = getDirectories(templatesDir);
const templateData = templatePaths.map(p => ({ path: p, name: path.basename(p) }));

function copyTemplate(templateName, destination) {
	let template = templateData.find(x => x.name === templateName);
	if (!template) {
		vorpal.log(`Template "${templateName}" not found!`);
		return;
	}
	vorpal.log(`Ok, it will be ${templateName}!`);
	const destinationDir = destination ||  path.join(config.projectsDir, template.name) || path.join(__dirname, 'dist', template.name);
	copySync(template.path, destinationDir);
	vorpal.log(`You project available in \n ${path.resolve(destinationDir)}`);
	child_process.execSync(`start ${path.resolve(destinationDir)}`);
}

vorpal
	.command('create', 'Creates new project from template', {})
	.option('-t, --template <template>', '')
	.option('-d, --destination <destination>', '')
	.action(function (args, callback) {
		getDirectories(templatesDir);
		let destination;
		if (args.options.destination)
			destination = args.options.destination;
		if (args.options.template) {
			copyTemplate(args.options.template, destination);
			process.exit();
		} else {
			if (templatePaths.length === 0) {
				this.log('Not templates found!');
				return callback();
			} else {
				this.prompt({
					type: 'list',
					name: 'template',
					message: 'Choose template: ',
					choices: templateData.map(x => x.name)
				}, (result) => {
					copyTemplate(result.template, destination);
					process.exit();
				});
			}
		}
	});

vorpal.log('Hello, i will help you to setup new project!');

vorpal.delimiter('>')
	.show()
	.parse(process.argv);
