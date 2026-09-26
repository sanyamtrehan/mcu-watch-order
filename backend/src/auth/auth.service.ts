import { ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './auth.model';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login-dto';
import { JwtPayload } from './typings/payload.typing';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from 'src/helpers/password.service';
import { Repository } from 'typeorm';
import { ENVIRONMENT } from 'src/helpers/configs/environment';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   *
   * @param createUserDto
   * @returns created user details
   */
  public async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Username or email is already in use');
    }

    const hashedPassword = await this.passwordService.hashPassword(
      createUserDto.password,
    );

    const user = this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      username: createUserDto.username,
    });
    const savedUser = await this.userRepository.save(user);
    return this._publicUser(savedUser);
  }

  /**
   *
   * @param loginDto
   * @returns user with login details
   */
  public async login(loginDto: LoginDto) {
    const userInDb = await this.userRepository.findOne({
      where: { username: loginDto.username },
      select: ['id', 'email', 'username', 'password'],
    });

    if (!userInDb) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    const isPasswordValid = await this.passwordService.comparePassword(
      loginDto.password,
      userInDb.password,
    );

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // generate and sign token
    const token = this._createToken(userInDb);

    return { token, user: this._publicUser(userInDb) };
  }

  private _createToken({ id, username }: User) {
    const expiresIn = ENVIRONMENT.EXPIRES_TIME;

    const user: JwtPayload = { id, username };
    const accessToken = this.jwtService.sign(user);
    return {
      expiresIn,
      accessToken,
    };
  }

  async findUser(userId: string) {
    const userInDb = await this.userRepository.findOne({ where: { id: userId } });
    if (!userInDb) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return userInDb;
  }

  private _publicUser({ id, email, username }: User) {
    return { id, email, username };
  }
}
