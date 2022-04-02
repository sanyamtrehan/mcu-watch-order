import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Data } from './data/data';
import { Exceptions } from './data/exceptions';
import { Mcu } from './mcu.model';
import { Model } from 'mongoose';

@Injectable()
export class McuService {
  data: Record<string, any> = Data;
  exceptions: string[] = Exceptions;
  constructor(@InjectModel('mcu') private readonly mcuModel: Model<Mcu>) {}

  /**
   *
   * @returns Promise of shows uploaded on databse
   */
  public async uploadData() {
    const formattedData: Record<string, any> = [];
    for (const showName in this.data) {
      if (this.exceptions.includes(showName)) {
        formattedData.push(...this.data[showName]);
      } else {
        formattedData.push(
          ...this._getShowsData(showName, this.data[showName]),
        );
      }
    }
    return this.mcuModel.insertMany(formattedData);
  }

  /**
   *
   * @param showName name of the show
   * @param seasons array of objects containig show seasons
   * @returns array of formated data in an array of objects
   */
  private _getShowsData(
    showName: string,
    seasons: Record<string, any>,
  ): Record<string, any>[] {
    const formattedData: Record<string, any>[] = [];
    for (const [key, value] of Object.entries(seasons)) {
      value.forEach((element: { name: string; releaseDate: Date }) => {
        element.name = `${this._getShowName(showName)} ${key}E${element.name}`;
      });
      formattedData.push(...value);
    }
    return formattedData;
  }

  /**
   *
   * @param text
   * @returns converts camelCase to Sentance Case
   */
  private _getShowName(text: string): string {
    const result = text.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
}
