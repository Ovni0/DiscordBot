const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Definiere die Pfade zu den verschiedenen YAML-Dateien
const warnsFilePath = path.resolve(__dirname, 'warns.yml');
const mutesFilePath = path.resolve(__dirname, 'mutes.yml');
const kicksFilePath = path.resolve(__dirname, 'kicks.yml');
const bansFilePath = path.resolve(__dirname, 'bans.yml');

// Funktion zum Laden von Warnungen
function loadWarns() {
    try {
        const warns = yaml.load(fs.readFileSync(warnsFilePath, 'utf8'));
        return warns || {};
    } catch (e) {
        console.error('Error loading warns:', e);
        return {};
    }
}

// Funktion zum Speichern von Warnungen
function saveWarns(warns) {
    try {
        const yamlStr = yaml.dump(warns);
        fs.writeFileSync(warnsFilePath, yamlStr, 'utf8');
    } catch (e) {
        console.error('Error saving warns:', e);
    }
}

// Funktion zum Laden von Mutes
function loadMutes() {
    try {
        const mutes = yaml.load(fs.readFileSync(mutesFilePath, 'utf8'));
        return mutes || {};
    } catch (e) {
        console.error('Error loading mutes:', e);
        return {};
    }
}

// Funktion zum Speichern von Mutes
function saveMutes(mutes) {
    try {
        const yamlStr = yaml.dump(mutes);
        fs.writeFileSync(mutesFilePath, yamlStr, 'utf8');
    } catch (e) {
        console.error('Error saving mutes:', e);
    }
}

// Funktion zum Laden von Bans
function loadBans() {
    try {
        const bans = yaml.load(fs.readFileSync(bansFilePath, 'utf8'));
        return bans || {};
    } catch (e) {
        console.error('Error loading bans:', e);
        return {};
    }
}

// Funktion zum Speichern von Bans
function saveBans(bans) {
    try {
        const yamlStr = yaml.dump(bans);
        fs.writeFileSync(bansFilePath, yamlStr, 'utf8');
    } catch (e) {
        console.error('Error saving bans:', e);
    }
}

// Funktion zum Laden von Kicks
function loadKicks() {
    try {
        const kicks = yaml.load(fs.readFileSync(kicksFilePath, 'utf8'));
        return kicks || {};
    } catch (e) {
        console.error('Error loading kicks:', e);
        return {};
    }
}

// Funktion zum Speichern von Kicks
function saveKicks(kicks) {
    try {
        const yamlStr = yaml.dump(kicks);
        fs.writeFileSync(kicksFilePath, yamlStr, 'utf8');
    } catch (e) {
        console.error('Error saving kicks:', e);
    }
}

module.exports = {
    loadWarns,
    saveWarns,
    loadMutes,
    saveMutes,
    loadBans,
    saveBans,
    loadKicks,
    saveKicks
};