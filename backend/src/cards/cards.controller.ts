import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Controller('cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  /** GET /api/cards/:id — including its comments */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cards.findOne(id);
  }

  /** POST /api/cards */
  @Post()
  create(@Body() dto: CreateCardDto) {
    return this.cards.create(dto);
  }

  /** PATCH /api/cards/:id */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.cards.update(id, dto);
  }

  /** PATCH /api/cards/:id/toggle — mark done / not done */
  @Patch(':id/toggle')
  toggleDone(@Param('id') id: string) {
    return this.cards.toggleDone(id);
  }

  /** DELETE /api/cards/:id */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cards.remove(id);
  }
}
