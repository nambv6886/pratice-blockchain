const mysql = require('mysql2/promise');
import * as config from 'config';
import logger from '../utils/logger';
import { errorType } from '../utils/index';

console.log('sql pool init');
const sql_config = config.get('mysql');
export const sql = mysql.createPool(sql_config);

export const doQuery = {
    updateRow: async function (tableName: string, row: any, id: number, conn:any = null) {
        try {
            if(!conn)
                conn = sql;
            for (let i = 0; i < Object.keys(row).length; i++) {
                if (Array.isArray(Object.values(row)[i])) {
                    // @ts-ignore
                    row[Object.keys(row)[i]] = Object.values(row)[i].join(',');
                }
            }
            if (tableName === 'operator')
                row['status'] = 'updated';
            let query = 'UPDATE ' + tableName + ' SET ' + Object.entries(row).map(x => x[0] + ' = ?').join(', ') + " WHERE id = " + id;
            // logger.log(query, Object.values(row));

            let [result, ignored] = await conn.query(query, Object.values(row));

            // @ts-ignore
            return result.affectedRows === 1;
        } catch (error) {
            throw {stack: errorType.UNKNOWN_ERROR};
        }
    },
    insertRow: async function (tableName: string, row: any, conn:any = null) {
        if(!conn)
            conn = sql;
        for (let i = 0; i < Object.keys(row).length; i++) {
            if (Array.isArray(Object.values(row)[i])) {
                // @ts-ignore
                row[Object.keys(row)[i]] = Object.values(row)[i].join(',');
            }
        }
        let query = 'INSERT INTO ' + tableName + '(' + Object.keys(row).join(',') + ') VALUES (' + ''.padStart((Object.values(row).length * 2) - 1, '?,') + ')';
        logger.log(query, Object.values(row));
        let [result, ignored] = await conn.query(query, Object.values(row));
        return result.insertId;
    },
    deleteRows: async function (tableName: string, Ids: number[]) {
        try {
            let [result, ignored] = await sql.query("DELETE FROM " + tableName + " WHERE id IN (?)", [Ids]);
            // @ts-ignore
            return result.affectedRows;
        } catch (error) {
            throw {stack: errorType.UNKNOWN_ERROR};
        }
    },
    listRows: async function (query: string, options: any = {}) {
        try {
            let limit: number = (options.limit ? options.limit : 50);
            let offset: number = (options.offset ? options.offset : 0);
            let order_by: string = (options.order_by ? (options.order_by + (options.reverse == 'true' ? ' desc, ' : ', ')) : '') + 'id';

            query += ` order by ${order_by} limit ${limit} offset ${offset}`;

            logger.info("list query", query);

            let [result, ignored] = await sql.query(query);
            return result;
        } catch (error) {
            throw {stack: errorType.UNKNOWN_ERROR};
        }
    },
};
