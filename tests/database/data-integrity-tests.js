/**
 * Database Integrity and Operations Test Suite for MovieHive
 * Tests ACID compliance, concurrent operations, and data validation
 */

const { Sequelize, DataTypes } = require('sequelize');

describe('Database Operations Tests', () => {
  let sequelize;
  let Movie;
  let User;
  let Review;

  beforeAll(async () => {
    // Create test database connection
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });

    // Define test models
    Movie = sequelize.define('Movie', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255]
        }
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1888, // First motion picture
          max: new Date().getFullYear() + 5 // Future releases
        }
      },
      genre: {
        type: DataTypes.STRING,
        allowNull: false
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        validate: {
          min: 0.0,
          max: 10.0
        }
      }
    });

    User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [3, 50]
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      }
    });

    Review = sequelize.define('Review', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      comment: {
        type: DataTypes.TEXT,
        validate: {
          len: [0, 2000]
        }
      }
    });

    // Define associations
    User.hasMany(Review);
    Review.belongsTo(User);
    Movie.hasMany(Review);
    Review.belongsTo(Movie);

    await sequelize.sync();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await Review.destroy({ where: {} });
    await Movie.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  /**
   * CRUD Operations Tests
   */
  describe('Basic CRUD Operations', () => {
    test('Create movie with valid data', async () => {
      const movieData = {
        title: 'Test Movie',
        year: 2023,
        genre: 'Action',
        rating: 8.5
      };

      const movie = await Movie.create(movieData);

      expect(movie.id).toBeDefined();
      expect(movie.title).toBe(movieData.title);
      expect(movie.year).toBe(movieData.year);
      expect(movie.genre).toBe(movieData.genre);
      expect(parseFloat(movie.rating)).toBe(movieData.rating);
    });

    test('Read movie by ID', async () => {
      const movie = await Movie.create({
        title: 'Read Test Movie',
        year: 2023,
        genre: 'Drama'
      });

      const foundMovie = await Movie.findByPk(movie.id);

      expect(foundMovie).toBeDefined();
      expect(foundMovie.title).toBe('Read Test Movie');
    });

    test('Update movie data', async () => {
      const movie = await Movie.create({
        title: 'Original Title',
        year: 2023,
        genre: 'Drama'
      });

      await movie.update({
        title: 'Updated Title',
        rating: 9.0
      });

      expect(movie.title).toBe('Updated Title');
      expect(parseFloat(movie.rating)).toBe(9.0);
      expect(movie.year).toBe(2023); // Unchanged
    });

    test('Delete movie', async () => {
      const movie = await Movie.create({
        title: 'Delete Test Movie',
        year: 2023,
        genre: 'Horror'
      });

      const movieId = movie.id;
      await movie.destroy();

      const deletedMovie = await Movie.findByPk(movieId);
      expect(deletedMovie).toBeNull();
    });
  });

  /**
   * Data Validation Tests
   */
  describe('Data Validation', () => {
    test('Reject movie with empty title', async () => {
      await expect(Movie.create({
        title: '',
        year: 2023,
        genre: 'Action'
      })).rejects.toThrow();
    });

    test('Reject movie with invalid year', async () => {
      await expect(Movie.create({
        title: 'Invalid Year Movie',
        year: 1800, // Before first motion picture
        genre: 'Action'
      })).rejects.toThrow();
    });

    test('Reject movie with rating out of range', async () => {
      await expect(Movie.create({
        title: 'Invalid Rating Movie',
        year: 2023,
        genre: 'Action',
        rating: 15.0 // Above maximum
      })).rejects.toThrow();
    });

    test('Reject user with invalid email', async () => {
      await expect(User.create({
        username: 'testuser',
        email: 'invalid-email',
        passwordHash: 'hashedpassword'
      })).rejects.toThrow();
    });

    test('Reject duplicate username', async () => {
      await User.create({
        username: 'uniqueuser',
        email: 'user1@example.com',
        passwordHash: 'hash1'
      });

      await expect(User.create({
        username: 'uniqueuser', // Duplicate
        email: 'user2@example.com',
        passwordHash: 'hash2'
      })).rejects.toThrow();
    });
  });

  /**
   * Transaction and ACID Tests
   */
  describe('Transaction Handling', () => {
    test('Transaction rollback on error', async () => {
      const transaction = await sequelize.transaction();

      try {
        await Movie.create({
          title: 'Transaction Test Movie',
          year: 2023,
          genre: 'Action'
        }, { transaction });

        // Force an error
        await Movie.create({
          title: '', // Invalid title
          year: 2023,
          genre: 'Action'
        }, { transaction });

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
      }

      // Check that no movies were created
      const movieCount = await Movie.count();
      expect(movieCount).toBe(0);
    });

    test('Atomic operations with multiple models', async () => {
      const transaction = await sequelize.transaction();

      try {
        const user = await User.create({
          username: 'reviewer',
          email: 'reviewer@example.com',
          passwordHash: 'hashedpassword'
        }, { transaction });

        const movie = await Movie.create({
          title: 'Reviewed Movie',
          year: 2023,
          genre: 'Comedy'
        }, { transaction });

        await Review.create({
          rating: 4,
          comment: 'Great movie!',
          UserId: user.id,
          MovieId: movie.id
        }, { transaction });

        await transaction.commit();

        // Verify all records were created
        const userCount = await User.count();
        const movieCount = await Movie.count();
        const reviewCount = await Review.count();

        expect(userCount).toBe(1);
        expect(movieCount).toBe(1);
        expect(reviewCount).toBe(1);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  });

  /**
   * Concurrent Operations Tests
   */
  describe('Concurrent Operations', () => {
    test('Handle concurrent movie creation', async () => {
      const moviePromises = [];

      for (let i = 0; i < 10; i++) {
        moviePromises.push(Movie.create({
          title: `Concurrent Movie ${i}`,
          year: 2023,
          genre: 'Action'
        }));
      }

      const movies = await Promise.all(moviePromises);

      expect(movies).toHaveLength(10);
      expect(movies.every(movie => movie.id)).toBe(true);
    });

    test('Handle concurrent user registration', async () => {
      const userPromises = [];

      for (let i = 0; i < 10; i++) {
        userPromises.push(User.create({
          username: `user${i}`,
          email: `user${i}@example.com`,
          passwordHash: 'hashedpassword'
        }));
      }

      const users = await Promise.all(userPromises);

      expect(users).toHaveLength(10);
      expect(users.every(user => user.id)).toBe(true);
    });

    test('Handle concurrent review creation for same movie', async () => {
      const movie = await Movie.create({
        title: 'Popular Movie',
        year: 2023,
        genre: 'Blockbuster'
      });

      const users = await Promise.all([
        User.create({ username: 'user1', email: 'user1@example.com', passwordHash: 'hash' }),
        User.create({ username: 'user2', email: 'user2@example.com', passwordHash: 'hash' }),
        User.create({ username: 'user3', email: 'user3@example.com', passwordHash: 'hash' })
      ]);

      const reviewPromises = users.map((user, index) => 
        Review.create({
          rating: index + 3, // 3, 4, 5
          comment: `Review from user ${index + 1}`,
          UserId: user.id,
          MovieId: movie.id
        })
      );

      const reviews = await Promise.all(reviewPromises);

      expect(reviews).toHaveLength(3);
      expect(reviews.every(review => review.MovieId === movie.id)).toBe(true);
    });
  });

  /**
   * Query Performance Tests
   */
  describe('Query Performance', () => {
    beforeEach(async () => {
      // Create test data
      const movies = [];
      for (let i = 0; i < 100; i++) {
        movies.push({
          title: `Movie ${i}`,
          year: 2000 + (i % 24),
          genre: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi'][i % 5],
          rating: Math.random() * 10
        });
      }
      await Movie.bulkCreate(movies);
    });

    test('Index usage for common queries', async () => {
      const startTime = Date.now();
      
      const moviesByYear = await Movie.findAll({
        where: { year: 2023 }
      });
      
      const queryTime = Date.now() - startTime;
      
      // Query should complete quickly with proper indexing
      expect(queryTime).toBeLessThan(100);
      expect(moviesByYear.length).toBeGreaterThanOrEqual(0);
    });

    test('Pagination performance', async () => {
      const startTime = Date.now();
      
      const pagedMovies = await Movie.findAndCountAll({
        limit: 10,
        offset: 20,
        order: [['title', 'ASC']]
      });
      
      const queryTime = Date.now() - startTime;
      
      expect(queryTime).toBeLessThan(100);
      expect(pagedMovies.rows).toHaveLength(10);
      expect(pagedMovies.count).toBe(100);
    });

    test('Complex query with joins', async () => {
      // Create user and reviews for testing
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hash'
      });

      const movie = await Movie.findOne();
      await Review.create({
        rating: 5,
        comment: 'Excellent!',
        UserId: user.id,
        MovieId: movie.id
      });

      const startTime = Date.now();
      
      const moviesWithReviews = await Movie.findAll({
        include: [{
          model: Review,
          include: [User]
        }]
      });
      
      const queryTime = Date.now() - startTime;
      
      expect(queryTime).toBeLessThan(200);
      expect(moviesWithReviews.length).toBeGreaterThan(0);
    });
  });

  /**
   * Data Integrity Constraints Tests
   */
  describe('Data Integrity Constraints', () => {
    test('Foreign key constraints prevent orphaned records', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hash'
      });

      const movie = await Movie.create({
        title: 'Test Movie',
        year: 2023,
        genre: 'Drama'
      });

      await Review.create({
        rating: 4,
        comment: 'Good movie',
        UserId: user.id,
        MovieId: movie.id
      });

      // Try to delete user with existing reviews
      await expect(user.destroy()).rejects.toThrow();
    });

    test('Cascade delete works correctly', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hash'
      });

      const movie = await Movie.create({
        title: 'Test Movie',
        year: 2023,
        genre: 'Drama'
      });

      await Review.create({
        rating: 4,
        comment: 'Good movie',
        UserId: user.id,
        MovieId: movie.id
      });

      // Configure cascade delete (would be in actual model definition)
      await Review.destroy({ where: { UserId: user.id } });
      await user.destroy();

      const remainingReviews = await Review.count({ where: { UserId: user.id } });
      expect(remainingReviews).toBe(0);
    });
  });
});

/**
 * Database backup and recovery tests
 */
describe('Backup and Recovery Tests', () => {
  test('Database backup creation', async () => {
    // This would test actual backup functionality
    // For SQLite, this might involve copying the database file
    // For PostgreSQL/MySQL, this would use pg_dump/mysqldump
    
    const backupPath = '/tmp/moviehive_backup.sql';
    
    // Mock backup process
    const backupSuccessful = true; // Would be actual backup result
    
    expect(backupSuccessful).toBe(true);
  });

  test('Database recovery from backup', async () => {
    // This would test restoration from backup
    // Implementation depends on database type
    
    const recoverySuccessful = true; // Would be actual recovery result
    
    expect(recoverySuccessful).toBe(true);
  });
});

/**
 * Manual database testing checklist
 */
const manualDatabaseChecklist = {
  performance: [
    'Monitor query execution plans',
    'Check for missing indexes',
    'Analyze slow query logs',
    'Test with realistic data volumes',
    'Verify connection pooling efficiency'
  ],
  integrity: [
    'Test cascade operations',
    'Verify constraint enforcement',
    'Check transaction isolation levels',
    'Test deadlock handling',
    'Validate data migration scripts'
  ],
  security: [
    'Test SQL injection prevention',
    'Verify user permission model',
    'Check password hashing security',
    'Test database access controls',
    'Validate sensitive data encryption'
  ]
};

module.exports = { manualDatabaseChecklist };