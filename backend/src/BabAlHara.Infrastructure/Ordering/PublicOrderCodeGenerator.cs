using System.Security.Cryptography;
using BabAlHara.Application.Ordering;

namespace BabAlHara.Infrastructure.Ordering;

public sealed class PublicOrderCodeGenerator : IOrderCodeGenerator
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int RandomLength = 10;

    public string Create(DateTimeOffset timestamp)
    {
        Span<char> randomPart = stackalloc char[RandomLength];
        for (var index = 0; index < randomPart.Length; index++)
        {
            randomPart[index] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        }

        return $"BH-{timestamp:yyMMdd}-{randomPart}";
    }
}
