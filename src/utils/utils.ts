import * as crypto from 'crypto';
import * as config from "config";
import * as speakeasy from "speakeasy";
import logger from "./logger";
import {errorType} from "./index";
const axios = require('axios');

const algorithm = 'aes-256-ctr';
const IV_LENGTH = 16; // For AES, this is always 16

export class Utils {
    public static generateSalt(length:number = 10) {
        const set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
        let salt = '';
        for (let i = 0; i < length; i++) {
            const p = Math.floor(Math.random() * set.length);
            salt += set[p];
        }
        return salt;
    };
    public static md5(str: string) {
        return crypto.createHash('md5').update(str).digest('hex');
    }
    public static sha256(str: string) {
        return crypto.createHash('sha256').update(str).digest('hex');
    }
    public static validatePassword(plainPass:string, hashedPass:string) {
        const salt = hashedPass.substr(0, 10);
        const validHash = salt + this.sha256(plainPass + salt);
        return (hashedPass === validHash);
    }

    public static saltAndHash(pass: string) {
        const salt = this.generateSalt();
        return (salt + this.sha256(pass + salt));
    };
    public static check_2fa_code(code:string, key:string) {
        // Use verify() to check the token against the secret
        var verified = speakeasy.totp.verify({ secret: key,
            encoding: 'base32',
            token: code });
        //console.log('check_2fa_code', verified);
        return verified;
    };
    // --- Normalized number
    public static normalizeNumber(num:number) {
        return Number(num.toFixed(8));
    };
    public static encrypt(text:string, pass: string) {
        if (pass.length > 32) {
            pass = pass.substr(0, 32);
        }
        while (pass.length < 32) {
            pass += '0';
        }

        let iv = crypto.randomBytes(IV_LENGTH);
        let cipher = crypto.createCipheriv(algorithm, Buffer.from(pass), iv);
        let encrypted = cipher.update(text);

        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + encrypted.toString('hex');
    };
    public static decrypt(text:string, pass: string) {
        if (pass.length > 32) {
            pass = pass.substr(0, 32);
        }
        while (pass.length < 32) {
            pass += '0';
        }
        let iv = Buffer.from(text.substr(0, 32), 'hex');
        let encryptedText = Buffer.from(text.substr(32), 'hex');
        let decipher = crypto.createDecipheriv(algorithm, Buffer.from(pass), iv);
        let decrypted = decipher.update(encryptedText);

        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    };

    public static IsNullOrUndefined(value: any): boolean {
        return typeof value == null || value == 'undefined' || value == '';
    }
}
