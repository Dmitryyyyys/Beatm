import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if category with same name or slug exists
    const existing = await this.categoriesRepository.findOne({
      where: [{ name: createCategoryDto.name }, { slug: createCategoryDto.slug }],
    });

    if (existing) {
      throw new ConflictException('Category with this name or slug already exists');
    }

    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    // Check for conflicts if name or slug is being updated
    if (updateCategoryDto.name || updateCategoryDto.slug) {
      const conditions: any[] = [];
      if (updateCategoryDto.name) {
        conditions.push({ name: updateCategoryDto.name });
      }
      if (updateCategoryDto.slug) {
        conditions.push({ slug: updateCategoryDto.slug });
      }

      if (conditions.length > 0) {
        const existing = await this.categoriesRepository.findOne({
          where: conditions as any,
        });

        if (existing && existing.id !== id) {
          throw new ConflictException('Category with this name or slug already exists');
        }
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }

  async findOrCreateByName(name: string): Promise<Category> {
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Try to find existing category by name or slug
    let category = await this.categoriesRepository.findOne({
      where: [{ name }, { slug }],
    });

    // If category doesn't exist, create it
    if (!category) {
      category = this.categoriesRepository.create({
        name,
        slug,
      });
      category = await this.categoriesRepository.save(category);
    }

    return category;
  }
}
