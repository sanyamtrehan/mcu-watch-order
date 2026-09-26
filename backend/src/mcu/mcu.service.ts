import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Data } from '../helpers/marvel-data';
import { Exceptions } from '../helpers/exceptions';
import { Mcu } from './mcu.model';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordService } from 'src/helpers/password.service';
import { ENVIRONMENT } from 'src/helpers/configs/environment';
import { FilterMcuDto } from './dto/filter-mcu.dto';
import { Repository } from 'typeorm';

@Injectable()
export class McuService {
  data: Record<string, any> = Data;
  exceptions: string[] = Exceptions;
  constructor(
    @InjectRepository(Mcu) private readonly mcuRepository: Repository<Mcu>,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   *
   * @returns Promise of shows uploaded on databse
   */
  public async uploadData(secretKey: string) {
    const isSecretKeyValid = await this.passwordService.comparePassword(
      secretKey,
      ENVIRONMENT.MCU_SECRET_KEY,
    );

    if (!isSecretKeyValid) {
      throw new HttpException('Invalid secret key', HttpStatus.UNAUTHORIZED);
    }

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
    return this.mcuRepository.upsert(formattedData, ['name', 'releaseDate']);
  }

  public async getData(filterMcuDto: FilterMcuDto) {
    return this.mcuRepository.find({
      order: { releaseDate: 'ASC' },
      skip: (filterMcuDto.page - 1) * filterMcuDto.limit,
      take: filterMcuDto.limit,
    });
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
      formattedData.push(
        ...value.map((element: { name: string; releaseDate: Date }) => ({
          ...element,
          name: `${this._getShowName(showName)} ${key}E${element.name}`,
        })),
      );
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
