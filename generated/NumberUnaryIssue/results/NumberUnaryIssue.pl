use strict;
use warnings;

package NumberUnaryIssue;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test {
    my ( $self, $num ) = @_;
    $num--;
}