namespace BabAlHara.Domain.Catalog;

public sealed class MenuImageAsset
{
    private MenuImageAsset()
    {
    }

    public MenuImageAsset(
        Guid id,
        string contentType,
        long contentLength,
        string contentHash,
        byte[] content,
        string? fileName = null,
        DateTimeOffset? createdAtUtc = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(contentLength);
        ArgumentNullException.ThrowIfNull(content);
        if (content.Length == 0)
        {
            throw new ArgumentException("Image content cannot be empty.", nameof(content));
        }

        Id = id;
        ContentType = RequireText(contentType, nameof(contentType));
        ContentLength = contentLength;
        ContentHash = RequireText(contentHash, nameof(contentHash));
        Content = content;
        FileName = string.IsNullOrWhiteSpace(fileName) ? null : fileName.Trim();
        CreatedAtUtc = createdAtUtc ?? DateTimeOffset.UtcNow;
    }

    public Guid Id { get; private set; }

    public string ContentType { get; private set; } = string.Empty;

    public long ContentLength { get; private set; }

    public string ContentHash { get; private set; } = string.Empty;

    public byte[] Content { get; private set; } = [];

    public string? FileName { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; private set; }

    private static string RequireText(string value, string parameterName) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException("A non-empty value is required.", parameterName)
            : value.Trim();
}
