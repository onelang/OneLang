package OneRegex;

sub match_from_index
{
    my ($pattern, $input, $offset) = @_;
    pos($input) = $offset;
    my @matches = ($input =~ /\G$pattern/g);
    my $result = scalar(@matches) ? \@matches : undef;
    return $result;
}

1;